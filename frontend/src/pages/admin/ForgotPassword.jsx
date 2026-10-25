import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, KeyRound, Loader2, Mail } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { LogoMark } from "@/components/Logo";

const RESEND_SECONDS = 60;
const inputCls = "neu-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600";
const labelCls = "mb-2 block font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500";

export default function AdminForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = enter email, 2 = enter code + new password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const sendCode = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setInfo(data.message);
      setCooldown(RESEND_SECONDS);
      setStep(2);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { email, code, new_password: password });
      navigate("/admin/login", { state: { resetOk: true } });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main data-testid="admin-forgot-page" className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="ak-grid-bg absolute inset-0" />
      <div className="neu-card neu-glow relative w-full max-w-md rounded-[2rem] p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="neu-raised rounded-2xl p-4"><LogoMark size={44} /></span>
          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-wide">Reset Password</h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400">
            {step === 1 ? "Step 1 of 2 · Verify email" : "Step 2 of 2 · Enter code"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={sendCode} data-testid="admin-forgot-form" className="space-y-5">
            <p className="text-sm leading-relaxed text-slate-400">
              Enter your admin email. We will send a 6-digit verification code to it.
            </p>
            <div>
              <label className={labelCls}>Email</label>
              <input required type="email" autoComplete="email" data-testid="admin-forgot-email-input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@al-kudsh.com" className={inputCls} />
            </div>
            {error && <p data-testid="admin-forgot-error" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading} data-testid="admin-forgot-submit-btn" className="btn-electric inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:opacity-60">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <Mail size={16} />}
              {loading ? "Sending…" : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={resetPassword} data-testid="admin-reset-form" className="space-y-5">
            {info && <p data-testid="admin-reset-info" className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-200">{info}</p>}
            <div>
              <label className={labelCls}>6-digit code</label>
              <input required inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" data-testid="admin-reset-code-input" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} placeholder="123456" className={`${inputCls} text-center font-mono text-lg tracking-[0.5em]`} />
            </div>
            <div>
              <label className={labelCls}>New password</label>
              <input required type="password" minLength={8} autoComplete="new-password" data-testid="admin-reset-password-input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Confirm new password</label>
              <input required type="password" minLength={8} autoComplete="new-password" data-testid="admin-reset-confirm-input" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className={inputCls} />
            </div>
            {error && <p data-testid="admin-reset-error" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} data-testid="admin-reset-submit-btn" className="btn-electric inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:opacity-60">
              {loading ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={16} />}
              {loading ? "Updating…" : "Reset Password"}
            </button>
            <button type="button" disabled={cooldown > 0 || loading} onClick={() => sendCode()} data-testid="admin-reset-resend-btn" className="w-full text-center font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60">
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
          </form>
        )}

        <Link to="/admin/login" data-testid="admin-forgot-back-link" className="mt-7 flex items-center justify-center gap-2 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-white">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </main>
  );
}