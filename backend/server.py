from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import asyncio
import ipaddress
import logging
import os
import re
import uuid
from datetime import datetime, timedelta, timezone
from html import escape
from html.parser import HTMLParser
from typing import Annotated, List, Optional
from urllib.parse import urlparse

import bcrypt
import httpx
import jwt
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.cors import CORSMiddleware

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
TOKEN_TTL_HOURS = 24
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Al-Kudsh Digital Solutions")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", "")

PyObjectId = Annotated[str, BeforeValidator(str)]

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def new_id() -> str:
    return str(uuid.uuid4())


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


# ---------- Email (Emergent managed Resend) ----------

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = ("reply with your password", "reply with the code", "send your password", "cvv",
             "send us your password", "enter your password below", "confirm your card number",
             "your full card number", "seed phrase", "recovery phrase", "verify your card",
             "social security number", "confirm your bank details")
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks the recipient for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links/assets must be absolute https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Shortened, numeric-host or credential-bearing URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != real link host {real!r} (G3)")


async def send_email(*, to: str, subject: str, html: str, reply_to: Optional[str] = None) -> Optional[str]:
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to or EMAIL_REPLY_TO:
        payload["contact_email"] = reply_to or EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


def _row(label: str, value: str) -> str:
    return (f'<tr><td style="padding:8px 16px;font-size:12px;color:#64748B;text-transform:uppercase;'
            f'letter-spacing:1px;vertical-align:top;width:110px">{escape(label)}</td>'
            f'<td style="padding:8px 16px;font-size:14px;color:#0A1128">{escape(value) or "—"}</td></tr>')


async def notify_quote(quote: "Quote") -> None:
    try:
        subject = f"New Quote Request — {quote.service or 'General'}"
        html = (
            '<table role="presentation" width="100%" style="background:#F1F5F9;padding:24px">'
            '<tr><td align="center"><table role="presentation" width="560" style="background:#FFFFFF;'
            'border-radius:12px;padding:8px 0;font-family:Arial,sans-serif">'
            '<tr><td style="padding:20px 16px 8px;font-size:18px;font-weight:bold;color:#0A1128">'
            f'New project quotation request</td></tr>'
            '<tr><td style="padding:0 16px 12px;font-size:13px;color:#64748B">'
            f'Submitted on the {escape(EMAIL_FROM_NAME)} website</td></tr>'
            + _row("Name", quote.name)
            + _row("Email", quote.email)
            + _row("Phone", quote.phone)
            + _row("Company", quote.company)
            + _row("Service", quote.service)
            + _row("Budget", quote.budget)
            + _row("Timeline", quote.timeline)
            + _row("Message", quote.message)
            + '<tr><td colspan="2" style="padding:16px;font-size:11px;color:#94A3B8">'
            f'Sent by {escape(EMAIL_FROM_NAME)}. Sign in to your admin dashboard to manage this request.'
            '</td></tr></table></td></tr></table>'
        )
        email_id = await send_email(to=OWNER_EMAIL, subject=subject, html=html)
        logger.info("Quote notification email sent: %s", email_id)
    except Exception as e:
        logger.error("Quote notification email failed (quote still saved): %s", str(e))


# ---------- Base document ----------

class BaseDocument(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="ignore")
    id: PyObjectId = Field(default_factory=new_id)

    def to_mongo(self) -> dict:
        doc = self.model_dump()
        doc["_id"] = doc.pop("id")
        return doc

    @classmethod
    def from_mongo(cls, doc: dict):
        doc = dict(doc)
        doc["id"] = doc.pop("_id")
        return cls(**doc)


class Service(BaseDocument):
    name: str
    slug: str
    tagline: str = ""
    description: str = ""
    icon: str = "Globe"
    features: List[str] = []
    order: int = 0


class PortfolioItem(BaseDocument):
    title: str
    category: str
    description: str = ""
    image_url: str = ""
    tags: List[str] = []
    year: str = ""
    link: str = ""
    github_url: str = ""
    featured: bool = False
    created_at: str = ""


class Testimonial(BaseDocument):
    name: str
    role: str = ""
    quote: str
    rating: int = 5
    created_at: str = ""


class Quote(BaseDocument):
    name: str
    email: str
    phone: str = ""
    company: str = ""
    service: str = ""
    budget: str = ""
    timeline: str = ""
    message: str
    status: str = "new"
    created_at: str = ""


class ContactMessage(BaseDocument):
    name: str
    email: str
    subject: str = ""
    message: str
    read: bool = False
    created_at: str = ""


# ---------- Request models ----------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class QuoteCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = ""
    company: str = ""
    service: str = ""
    budget: str = ""
    timeline: str = ""
    message: str = Field(min_length=10, max_length=4000)


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    subject: str = ""
    message: str = Field(min_length=5, max_length=4000)


class StatusUpdate(BaseModel):
    status: str


class ReadUpdate(BaseModel):
    read: bool


class ServiceUpsert(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    slug: Optional[str] = None
    tagline: str = ""
    description: str = ""
    icon: str = "Globe"
    features: List[str] = []
    order: int = 0


class PortfolioUpsert(BaseModel):
    title: str = Field(min_length=2, max_length=160)
    category: str = ""
    description: str = ""
    image_url: str = ""
    tags: List[str] = []
    year: str = ""
    link: str = ""
    github_url: str = ""
    featured: bool = False


class TestimonialUpsert(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    role: str = ""
    quote: str = Field(min_length=5, max_length=1000)
    rating: int = Field(default=5, ge=1, le=5)


# ---------- Auth helpers ----------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_token(admin_id: str, email: str) -> str:
    payload = {
        "sub": admin_id,
        "email": email,
        "role": "admin",
        "type": "access",
        "exp": now_utc() + timedelta(hours=TOKEN_TTL_HOURS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("ak_access")
    auth = request.headers.get("Authorization", "")
    if not token and auth.startswith("Bearer "):
        token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    admin = await db.admins.find_one({"_id": payload.get("sub")})
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return {"id": admin["_id"], "email": admin["email"], "name": admin.get("name", "Admin")}


# ---------- Brute force protection ----------

async def ensure_not_locked(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    if not rec:
        return
    locked_until = rec.get("locked_until")
    if locked_until and datetime.fromisoformat(locked_until) > now_utc():
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")


async def record_failed_attempt(identifier: str):
    rec = await db.login_attempts.find_one({"identifier": identifier})
    count = (rec or {}).get("count", 0) + 1
    update = {"count": count, "last_attempt": now_utc().isoformat()}
    if count >= MAX_FAILED_ATTEMPTS:
        update["count"] = 0
        update["locked_until"] = (now_utc() + timedelta(minutes=LOCKOUT_MINUTES)).isoformat()
    await db.login_attempts.update_one({"identifier": identifier}, {"$set": update}, upsert=True)


# ---------- App ----------

limiter = Limiter(key_func=get_remote_address, default_limits=["300/minute"])
app = FastAPI(title="Al-Kudsh API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_router = APIRouter(prefix="/api")


@app.middleware("http")
async def security_headers(request: Request, call_next):
    # Block cross-origin state-changing requests to sensitive routes (CSRF hardening)
    if request.method in {"POST", "PUT", "PATCH", "DELETE"} and (
        request.url.path.startswith("/api/admin/") or request.url.path.startswith("/api/auth/")
    ):
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin:
            origin_host = urlparse(origin).netloc.split(":")[0]
            host = (request.headers.get("x-forwarded-host") or request.url.hostname or "").split(":")[0]
            if origin_host != host:
                return JSONResponse(status_code=403, content={"detail": "Cross-origin request blocked"})
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@api_router.get("/")
async def root():
    return {"message": "Al-Kudsh API — DIGITAL SOLUTIONS"}


# ---------- Public endpoints ----------

@api_router.get("/services", response_model=List[Service])
async def list_services():
    docs = await db.services.find().sort("order", 1).to_list(100)
    return [Service.from_mongo(d) for d in docs]


@api_router.get("/portfolio", response_model=List[PortfolioItem])
async def list_portfolio():
    docs = await db.portfolio.find().sort([("featured", -1), ("created_at", -1)]).to_list(200)
    return [PortfolioItem.from_mongo(d) for d in docs]


@api_router.get("/testimonials", response_model=List[Testimonial])
async def list_testimonials():
    docs = await db.testimonials.find().sort("created_at", -1).to_list(100)
    return [Testimonial.from_mongo(d) for d in docs]


@api_router.get("/stats")
async def public_stats():
    return {
        "projects": await db.portfolio.count_documents({}),
        "services": await db.services.count_documents({}),
    }


@api_router.post("/quotes", response_model=Quote)
@limiter.limit("5/minute")
async def create_quote(request: Request, body: QuoteCreate):
    quote = Quote(**body.model_dump(), created_at=now_utc().isoformat())
    await db.quotes.insert_one(quote.to_mongo())
    if OWNER_EMAIL:
        asyncio.create_task(notify_quote(quote))
    return quote


@api_router.post("/contact", response_model=ContactMessage)
@limiter.limit("5/minute")
async def create_contact(request: Request, body: ContactCreate):
    msg = ContactMessage(**body.model_dump(), created_at=now_utc().isoformat())
    await db.contacts.insert_one(msg.to_mongo())
    return msg


# ---------- Auth endpoints ----------

@api_router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, body: LoginRequest, response: Response):
    email = body.email.lower().strip()
    identifier = f"{get_remote_address(request)}:{email}"
    await ensure_not_locked(identifier)
    admin = await db.admins.find_one({"email": email})
    if not admin or not verify_password(body.password, admin["password_hash"]):
        await record_failed_attempt(identifier)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_many({"identifier": identifier})
    token = create_token(admin["_id"], email)
    response.set_cookie(
        key="ak_access", value=token, httponly=True, secure=True,
        samesite="none", max_age=TOKEN_TTL_HOURS * 3600, path="/",
    )
    return {"token": token, "admin": {"email": email, "name": admin.get("name", "Admin")}}


@api_router.get("/auth/me")
async def auth_me(admin=Depends(get_current_admin)):
    return admin


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("ak_access", path="/")
    return {"ok": True}


@api_router.post("/auth/change-password")
@limiter.limit("5/minute")
async def change_password(request: Request, body: PasswordChange, admin=Depends(get_current_admin)):
    rec = await db.admins.find_one({"_id": admin["id"]})
    if not rec or not verify_password(body.current_password, rec["password_hash"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await db.admins.update_one({"_id": admin["id"]}, {"$set": {"password_hash": hash_password(body.new_password)}})
    logger.info("Admin password changed for %s", admin["email"])
    return {"ok": True}


# ---------- Admin endpoints ----------

@api_router.get("/admin/stats")
async def admin_stats(admin=Depends(get_current_admin)):
    return {
        "quotes_total": await db.quotes.count_documents({}),
        "quotes_new": await db.quotes.count_documents({"status": "new"}),
        "messages_total": await db.contacts.count_documents({}),
        "messages_unread": await db.contacts.count_documents({"read": False}),
        "portfolio_total": await db.portfolio.count_documents({}),
        "services_total": await db.services.count_documents({}),
        "testimonials_total": await db.testimonials.count_documents({}),
    }


@api_router.get("/admin/quotes", response_model=List[Quote])
async def admin_quotes(admin=Depends(get_current_admin)):
    docs = await db.quotes.find().sort("created_at", -1).to_list(500)
    return [Quote.from_mongo(d) for d in docs]


@api_router.patch("/admin/quotes/{qid}", response_model=Quote)
async def admin_update_quote(qid: str, body: StatusUpdate, admin=Depends(get_current_admin)):
    if body.status not in {"new", "in-review", "quoted", "closed"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    res = await db.quotes.update_one({"_id": qid}, {"$set": {"status": body.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return Quote.from_mongo(await db.quotes.find_one({"_id": qid}))


@api_router.delete("/admin/quotes/{qid}")
async def admin_delete_quote(qid: str, admin=Depends(get_current_admin)):
    res = await db.quotes.delete_one({"_id": qid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"ok": True}


@api_router.get("/admin/contacts", response_model=List[ContactMessage])
async def admin_contacts(admin=Depends(get_current_admin)):
    docs = await db.contacts.find().sort("created_at", -1).to_list(500)
    return [ContactMessage.from_mongo(d) for d in docs]


@api_router.patch("/admin/contacts/{cid}", response_model=ContactMessage)
async def admin_update_contact(cid: str, body: ReadUpdate, admin=Depends(get_current_admin)):
    res = await db.contacts.update_one({"_id": cid}, {"$set": {"read": body.read}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return ContactMessage.from_mongo(await db.contacts.find_one({"_id": cid}))


@api_router.delete("/admin/contacts/{cid}")
async def admin_delete_contact(cid: str, admin=Depends(get_current_admin)):
    res = await db.contacts.delete_one({"_id": cid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message not found")
    return {"ok": True}


@api_router.post("/admin/services", response_model=Service)
async def admin_create_service(body: ServiceUpsert, admin=Depends(get_current_admin)):
    data = body.model_dump()
    data["slug"] = data.get("slug") or slugify(data["name"])
    existing = await db.services.find_one({"slug": data["slug"]})
    if existing:
        raise HTTPException(status_code=400, detail="A service with this slug already exists")
    service = Service(**data)
    await db.services.insert_one(service.to_mongo())
    return service


@api_router.put("/admin/services/{sid}", response_model=Service)
async def admin_update_service(sid: str, body: ServiceUpsert, admin=Depends(get_current_admin)):
    data = body.model_dump()
    data["slug"] = data.get("slug") or slugify(data["name"])
    res = await db.services.update_one({"_id": sid}, {"$set": data})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return Service.from_mongo(await db.services.find_one({"_id": sid}))


@api_router.delete("/admin/services/{sid}")
async def admin_delete_service(sid: str, admin=Depends(get_current_admin)):
    res = await db.services.delete_one({"_id": sid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"ok": True}


@api_router.post("/admin/portfolio", response_model=PortfolioItem)
async def admin_create_portfolio(body: PortfolioUpsert, admin=Depends(get_current_admin)):
    item = PortfolioItem(**body.model_dump(), created_at=now_utc().isoformat())
    await db.portfolio.insert_one(item.to_mongo())
    return item


@api_router.put("/admin/portfolio/{pid}", response_model=PortfolioItem)
async def admin_update_portfolio(pid: str, body: PortfolioUpsert, admin=Depends(get_current_admin)):
    res = await db.portfolio.update_one({"_id": pid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return PortfolioItem.from_mongo(await db.portfolio.find_one({"_id": pid}))


@api_router.delete("/admin/portfolio/{pid}")
async def admin_delete_portfolio(pid: str, admin=Depends(get_current_admin)):
    res = await db.portfolio.delete_one({"_id": pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


@api_router.post("/admin/testimonials", response_model=Testimonial)
async def admin_create_testimonial(body: TestimonialUpsert, admin=Depends(get_current_admin)):
    item = Testimonial(**body.model_dump(), created_at=now_utc().isoformat())
    await db.testimonials.insert_one(item.to_mongo())
    return item


@api_router.put("/admin/testimonials/{tid}", response_model=Testimonial)
async def admin_update_testimonial(tid: str, body: TestimonialUpsert, admin=Depends(get_current_admin)):
    res = await db.testimonials.update_one({"_id": tid}, {"$set": body.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return Testimonial.from_mongo(await db.testimonials.find_one({"_id": tid}))


@api_router.delete("/admin/testimonials/{tid}")
async def admin_delete_testimonial(tid: str, admin=Depends(get_current_admin)):
    res = await db.testimonials.delete_one({"_id": tid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"ok": True}


app.include_router(api_router)

from codebase import build_codebase_router

app.include_router(build_codebase_router(db, get_current_admin), prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- Seed data ----------

SERVICES_SEED = [
    {"name": "Website Development", "slug": "website-development", "icon": "Globe", "order": 1,
     "tagline": "High-conversion, ultra-fast marketing & enterprise web presences.",
     "description": "From striking marketing sites to complex enterprise portals, we engineer websites that load instantly, rank higher, and convert visitors into customers.",
     "features": ["Conversion-focused UX & UI design", "Blazing performance & Core Web Vitals", "SEO architecture & analytics setup", "CMS so your team edits with ease"]},
    {"name": "Mobile App Development", "slug": "mobile-app-development", "icon": "Smartphone", "order": 2,
     "tagline": "Native iOS & Android experiences built for performance and scale.",
     "description": "We design and ship polished mobile apps that users love — from MVP to millions of users, with offline resilience and store-ready delivery.",
     "features": ["iOS & Android from one codebase", "Push notifications & offline sync", "App Store & Play Store launch", "Crash analytics & monitoring"]},
    {"name": "Web Applications", "slug": "web-applications", "icon": "PanelsTopLeft", "order": 3,
     "tagline": "Complex SaaS platforms, client portals, and cloud web software.",
     "description": "Full-scale web applications with dashboards, roles, payments, and integrations — engineered for security, speed, and growth.",
     "features": ["Secure multi-role architectures", "Realtime data & dashboards", "Payment & third-party integrations", "Cloud-native, auto-scaling deployment"]},
    {"name": "Desktop Software", "slug": "desktop-software", "icon": "Monitor", "order": 4,
     "tagline": "Cross-platform desktop tools with offline resilience and native speed.",
     "description": "Windows, macOS, and Linux desktop applications that feel native, work offline, and sync when connected.",
     "features": ["Windows, macOS & Linux builds", "Offline-first local databases", "Auto-update & licensing systems", "Hardware & peripheral integration"]},
    {"name": "AI Integration", "slug": "ai-integration", "icon": "BrainCircuit", "order": 5,
     "tagline": "Custom LLM agents, workflow automation, and predictive analytics.",
     "description": "We embed practical AI into your business — chat assistants, document intelligence, and automation that cuts hours of manual work.",
     "features": ["Custom GPT/LLM assistants", "Document parsing & data extraction", "Workflow & support automation", "Predictive analytics & reporting"]},
    {"name": "School Management Systems", "slug": "school-management-systems", "icon": "GraduationCap", "order": 6,
     "tagline": "All-in-one academic, grading, parent portal, and billing platforms.",
     "description": "A complete digital campus: admissions, attendance, grading, timetables, parent communication, and fee management in one system.",
     "features": ["Admissions & student records", "Attendance, grades & report cards", "Parent & teacher portals", "Fees, invoicing & receipts"]},
    {"name": "Restaurant Management Systems", "slug": "restaurant-management-systems", "icon": "UtensilsCrossed", "order": 7,
     "tagline": "POS, kitchen display, inventory control, and table management.",
     "description": "Run front-of-house and back-of-house in perfect sync — orders, kitchen displays, inventory, staff, and delivery integrations.",
     "features": ["Fast POS & table management", "Kitchen display & order routing", "Inventory & supplier tracking", "Online ordering & delivery links"]},
    {"name": "Booking Platforms", "slug": "booking-platforms", "icon": "CalendarCheck", "order": 8,
     "tagline": "Automated reservation, ticketing, and appointment scheduling engines.",
     "description": "Let customers book, pay, and get reminded automatically — for clinics, salons, venues, rentals, and events.",
     "features": ["Real-time availability calendars", "Online payments & deposits", "SMS & email reminders", "Staff scheduling & resources"]},
    {"name": "Custom Business Software", "slug": "custom-business-software", "icon": "Settings2", "order": 9,
     "tagline": "Bespoke ERP, CRM, and operational automation tailored to your flow.",
     "description": "When off-the-shelf software fights your process, we build software that fits it — ERP, CRM, and internal tools shaped around your operations.",
     "features": ["Process mapping & consultation", "Custom ERP / CRM modules", "Legacy system integration", "Long-term support & evolution"]},
]


async def seed_admin():
    email = os.environ.get("ADMIN_EMAIL", "admin@al-kudsh.com").lower()
    password = os.environ.get("ADMIN_PASSWORD", "AlKudsh@2026")
    existing = await db.admins.find_one({"email": email})
    if not existing:
        await db.admins.insert_one({
            "_id": new_id(), "email": email, "name": "Al-Kudsh Admin", "role": "admin",
            "password_hash": hash_password(password), "created_at": now_utc().isoformat(),
        })
        logger.info("Admin seeded: %s", email)


@app.on_event("startup")
async def startup():
    await db.admins.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await seed_admin()
    if await db.services.count_documents({}) == 0:
        await db.services.insert_many([Service(**s).to_mongo() for s in SERVICES_SEED])
        logger.info("Seeded %d services", len(SERVICES_SEED))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
