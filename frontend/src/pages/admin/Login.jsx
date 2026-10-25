import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const resetOk = Boolean(location.state?.resetOk);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", form);
      localStorage.setItem("ak_token", data.token);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="admin-login-page" className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="ak-grid-bg absolute inset-0" />
      <div className="neu-card neu-glow relative w-full max-w-md rounded-[2rem] p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="neu-raised rounded-2xl p-4"><LogoMark size={44} /></span>
          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-wide">Al-Kudsh</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400">Admin Console</p>
        </div>
        <form onSubmit={submit} data-testid="admin-login-form" className="space-y-5">
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Email</label>
            <input required type="email" data-testid="admin-email-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@al-kudsh.com" className="neu-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600" />
          </div>
          <div>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Password</label>
            <input required type="password" data-testid="admin-password-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••••" className="neu-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600" />
          </div>
          <div className="-mt-1 text-right">
            <Link to="/admin/forgot-password" data-testid="admin-forgot-password-link" className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:text-white">
              Forgot password?
            </Link>
          </div>
          {resetOk && !error && (
            <p data-testid="admin-reset-success" className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">Password updated. Sign in with your new password.</p>
          )}
          {error && (
            <p data-testid="admin-login-error" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
          )}
          <button type="submit" disabled={loading} data-testid="admin-login-submit-btn" className="btn-electric inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:opacity-60">
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Lock size={16} />}
            {loading ? "Verifying…" : "Sign In Securely"}
          </button>
        </form>
        <p className="mt-7 flex items-center justify-center gap-2 text-center font-mono text-[10px] tracking-wider text-slate-600">
          <ShieldCheck size={13} className="text-cyan-500" /> RATE-LIMITED · BRUTE-FORCE PROTECTED · JWT
        </p>
      </div>
    </main>
  );
}