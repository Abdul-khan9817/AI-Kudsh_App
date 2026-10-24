import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
APP_NAME = "al-kudsh"
MAX_UPLOAD_MB = 100
storage_key = None


async def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY})
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key


async def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = await init_storage()
    async with httpx.AsyncClient(timeout=180) as client:
        resp = await client.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            content=data,
        )
    if resp.status_code == 404:
        key = await init_storage(force=True)
        async with httpx.AsyncClient(timeout=180) as client:
            resp = await client.put(
                f"{STORAGE_URL}/objects/{path}",
                headers={"X-Storage-Key": key, "Content-Type": content_type},
                content=data,
            )
    resp.raise_for_status()
    return resp.json()


async def get_object(path: str):
    key = await init_storage()
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
    if resp.status_code == 404:
        key = await init_storage(force=True)
        async with httpx.AsyncClient(timeout=120) as client:
            resp = await client.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key})
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


def build_codebase_router(db, get_current_admin):
    router = APIRouter()

    @router.get("/admin/codebases")
    async def list_codebases(admin=Depends(get_current_admin)):
        docs = await db.codebases.find({"is_deleted": False}).sort("created_at", -1).to_list(200)
        for d in docs:
            d["id"] = d.pop("_id")
        return docs

    @router.post("/admin/codebases")
    async def create_codebase(
        name: str = Form(...),
        github_url: str = Form(""),
        description: str = Form(""),
        file: Optional[UploadFile] = File(None),
        admin=Depends(get_current_admin),
    ):
        name = name.strip()
        github_url = github_url.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Name is required")
        rec = {
            "_id": str(uuid.uuid4()),
            "name": name,
            "github_url": github_url,
            "description": description.strip(),
            "storage_path": "",
            "original_filename": "",
            "size": 0,
            "is_deleted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        if file and file.filename:
            if not file.filename.lower().endswith(".zip"):
                raise HTTPException(status_code=400, detail="Only .zip archives are accepted")
            data = await file.read()
            if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"File exceeds {MAX_UPLOAD_MB}MB limit")
            result = await put_object(f"{APP_NAME}/codebases/{rec['_id']}.zip", data, "application/zip")
            rec["storage_path"] = result["path"]
            rec["original_filename"] = file.filename
            rec["size"] = result.get("size", len(data))
        if not rec["storage_path"] and not github_url:
            raise HTTPException(status_code=400, detail="Provide a GitHub link or upload a ZIP archive")
        await db.codebases.insert_one(rec)
        rec["id"] = rec.pop("_id")
        return rec

    @router.get("/codebases/{cid}/download")
    async def download_codebase(cid: str, admin=Depends(get_current_admin)):
        rec = await db.codebases.find_one({"_id": cid, "is_deleted": False})
        if not rec or not rec.get("storage_path"):
            raise HTTPException(status_code=404, detail="File not found")
        data, _ = await get_object(rec["storage_path"])
        filename = rec.get("original_filename") or "codebase.zip"
        return Response(
            content=data,
            media_type="application/zip",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    @router.delete("/admin/codebases/{cid}")
    async def delete_codebase(cid: str, admin=Depends(get_current_admin)):
        res = await db.codebases.update_one({"_id": cid}, {"$set": {"is_deleted": True}})
        if res.matched_count == 0:
            raise HTTPException(status_code=404, detail="Codebase not found")
        return {"ok": True}

    return router
