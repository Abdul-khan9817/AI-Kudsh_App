import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LayoutDashboard, FileText, Mail, Briefcase, Layers, Star, KeyRound, FolderGit2, LogOut, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { LogoMark } from "@/components/Logo";
import { OverviewTab, QuotesTab, MessagesTab, PortfolioTab, ServicesTab, TestimonialsTab, SettingsTab, CodebaseTab } from "@/pages/admin/tabs";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "quotes", label: "Quotes", icon: FileText },
  { id: "messages", label: "Messages", icon: Mail },
  { id: "portfolio", label: "Portfolio", icon: Briefcase },
  { id: "services", label: "Services", icon: Layers },
  { id: "testimonials", label: "Testimonials", icon: Star },
  { id: "codebase", label: "Codebase", icon: FolderGit2 },
  { id: "settings", label: "Settings", icon: KeyRound },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    if (!localStorage.getItem("ak_token")) return setAuth(false);
    api.get("/auth/me")
      .then((r) => { setAdmin(r.data); setAuth(true); })
      .catch(() => { localStorage.removeItem("ak_token"); setAuth(false); });
  }, []);

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch {}
    localStorage.removeItem("ak_token");
    toast.success("Signed out");
    navigate("/admin/login");
  };

  if (auth === null)
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="admin-loading">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  if (auth === false) return <Navigate to="/admin/login" replace />;

  return (
    <main data-testid="admin-dashboard" className="min-h-screen px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="neu-card flex flex-wrap items-center justify-between gap-4 rounded-3xl px-7 py-5">
          <div className="flex items-center gap-4">
            <span className="neu-raised rounded-2xl p-2.5"><LogoMark size={34} /></span>
            <div className="leading-tight">
              <p className="font-display text-lg font-extrabold tracking-wide">Al-Kudsh</p>
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-cyan-400">Admin Console · {admin?.email}</p>
            </div>
          </div>
          <button onClick={logout} data-testid="admin-logout-btn" className="btn-ghost inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-slate-300">
            <LogOut size={14} /> Sign Out
          </button>
        </header>

        <nav className="mt-6 flex flex-wrap gap-3" data-testid="admin-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-testid={`admin-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold transition-all duration-300 ${
                tab === t.id ? "btn-electric text-white" : "neu-raised text-slate-400 hover:text-white"
              }`}
            >
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>

        <section className="mt-8 pb-16">
          {tab === "overview" && <OverviewTab go={setTab} />}
          {tab === "quotes" && <QuotesTab />}
          {tab === "messages" && <MessagesTab />}
          {tab === "portfolio" && <PortfolioTab />}
          {tab === "services" && <ServicesTab />}
          {tab === "testimonials" && <TestimonialsTab />}
          {tab === "codebase" && <CodebaseTab />}
          {tab === "settings" && <SettingsTab />}
        </section>
      </div>
    </main>
  );
}
