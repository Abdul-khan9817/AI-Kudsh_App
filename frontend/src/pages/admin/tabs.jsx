import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Briefcase, Check, Download, FileText, FolderGit2, KeyRound, Layers, Loader2, Mail, Plus, Star, Trash2, Upload, X } from "lucide-react";
import api, { formatApiError } from "@/lib/api";

const INPUT = "neu-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600";
const STATUSES = ["new", "in-review", "quoted", "closed"];
const STATUS_COLORS = {
  new: "text-cyan-300 border-cyan-400/30 bg-cyan-400/10",
  "in-review": "text-amber-300 border-amber-400/30 bg-amber-400/10",
  quoted: "text-emerald-300 border-emerald-400/30 bg-emerald-400/10",
  closed: "text-slate-400 border-white/10 bg-white/5",
};

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040814]/85 p-4 backdrop-blur-sm" data-testid="admin-modal">
    <div className="neu-card max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl p-7">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <button onClick={onClose} data-testid="modal-close-btn" className="neu-raised rounded-full p-2 text-slate-400 hover:text-white"><X size={16} /></button>
      </div>
      {children}
    </div>
  </div>
);

const Empty = ({ text }) => <p className="neu-pressed rounded-2xl py-14 text-center text-sm text-slate-500">{text}</p>;

export function OverviewTab({ go }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {}); }, []);
  if (!stats) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  const cards = [
    { label: "New Quotes", value: stats.quotes_new, sub: `${stats.quotes_total} total`, icon: FileText, tab: "quotes" },
    { label: "Unread Messages", value: stats.messages_unread, sub: `${stats.messages_total} total`, icon: Mail, tab: "messages" },
    { label: "Portfolio Projects", value: stats.portfolio_total, sub: "live on site", icon: Briefcase, tab: "portfolio" },
    { label: "Testimonials", value: stats.testimonials_total, sub: "on review wall", icon: Star, tab: "testimonials" },
  ];
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4" data-testid="admin-overview">
      {cards.map((c) => (
        <button key={c.label} onClick={() => go(c.tab)} data-testid={`stat-card-${c.label.toLowerCase().replace(/\s+/g, "-")}`} className="neu-card neu-card-hover rounded-3xl p-7 text-left">
          <c.icon size={22} className="text-cyan-400" />
          <p className="mt-5 font-display text-4xl font-extrabold ak-gradient-text">{c.value}</p>
          <p className="mt-2 text-sm font-medium text-white">{c.label}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">{c.sub}</p>
        </button>
      ))}
    </div>
  );
}

export function QuotesTab() {
  const [quotes, setQuotes] = useState(null);
  const load = useCallback(() => api.get("/admin/quotes").then((r) => setQuotes(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (q, status) => {
    try {
      await api.patch(`/admin/quotes/${q.id}`, { status });
      setQuotes((qs) => qs.map((x) => (x.id === q.id ? { ...x, status } : x)));
      toast.success(`Marked as ${status}`);
    } catch (e) { toast.error(formatApiError(e)); }
  };
  const remove = async (q) => {
    if (!window.confirm(`Delete quote from ${q.name}?`)) return;
    try {
      await api.delete(`/admin/quotes/${q.id}`);
      setQuotes((qs) => qs.filter((x) => x.id !== q.id));
      toast.success("Quote deleted");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!quotes) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  if (quotes.length === 0) return <Empty text="No quote requests yet — new submissions appear here." />;
  return (
    <div className="space-y-5" data-testid="admin-quotes-list">
      {quotes.map((q) => (
        <article key={q.id} data-testid={`quote-row-${q.id}`} className="neu-card rounded-3xl p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold">{q.name} <span className="ml-2 text-sm font-normal text-slate-400">{q.company}</span></p>
              <p className="mt-1 font-mono text-xs text-slate-500">{q.email}{q.phone ? ` · ${q.phone}` : ""}</p>
              <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10px] uppercase tracking-widest">
                <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">{q.service}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">{q.budget}</span>
                <span className="rounded-full border border-white/10 px-3 py-1 text-slate-300">{q.timeline}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select value={q.status} onChange={(e) => setStatus(q, e.target.value)} data-testid={`quote-status-${q.id}`} className={`neu-input rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-widest ${STATUS_COLORS[q.status] || ""}`}>
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={() => remove(q)} data-testid={`quote-delete-${q.id}`} className="neu-raised rounded-full p-2.5 text-slate-500 transition-colors hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-[#0A1128] p-4 text-sm leading-relaxed text-slate-300">{q.message}</p>
          <p className="mt-3 font-mono text-[10px] text-slate-600">{new Date(q.created_at).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}

export function MessagesTab() {
  const [messages, setMessages] = useState(null);
  const load = useCallback(() => api.get("/admin/contacts").then((r) => setMessages(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const toggleRead = async (m) => {
    try {
      await api.patch(`/admin/contacts/${m.id}`, { read: !m.read });
      setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, read: !m.read } : x)));
    } catch (e) { toast.error(formatApiError(e)); }
  };
  const remove = async (m) => {
    if (!window.confirm(`Delete message from ${m.name}?`)) return;
    try {
      await api.delete(`/admin/contacts/${m.id}`);
      setMessages((ms) => ms.filter((x) => x.id !== m.id));
      toast.success("Message deleted");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  if (!messages) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  if (messages.length === 0) return <Empty text="No contact messages yet." />;
  return (
    <div className="space-y-5" data-testid="admin-messages-list">
      {messages.map((m) => (
        <article key={m.id} data-testid={`message-row-${m.id}`} className={`neu-card rounded-3xl p-6 ${m.read ? "opacity-60" : ""}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-display text-lg font-semibold">{m.name} {!m.read && <span className="ml-2 rounded-full bg-cyan-400/15 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-cyan-300">New</span>}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">{m.email}{m.subject ? ` · ${m.subject}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => toggleRead(m)} data-testid={`message-read-${m.id}`} className="btn-ghost inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-slate-300">
                <Check size={12} /> {m.read ? "Mark unread" : "Mark read"}
              </button>
              <button onClick={() => remove(m)} data-testid={`message-delete-${m.id}`} className="neu-raised rounded-full p-2.5 text-slate-500 transition-colors hover:text-red-400"><Trash2 size={15} /></button>
            </div>
          </div>
          <p className="mt-4 rounded-2xl bg-[#0A1128] p-4 text-sm leading-relaxed text-slate-300">{m.message}</p>
          <p className="mt-3 font-mono text-[10px] text-slate-600">{new Date(m.created_at).toLocaleString()}</p>
        </article>
      ))}
    </div>
  );
}

export function PortfolioTab() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const blank = { title: "", category: "", description: "", image_url: "", tags: "", year: "", link: "", github_url: "", featured: false };
  const [form, setForm] = useState(blank);
  const load = useCallback(() => api.get("/portfolio").then((r) => setItems(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(blank); setEditing("new"); };
  const openEdit = (p) => { setForm({ ...p, tags: (p.tags || []).join(", ") }); setEditing(p.id); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean) };
    try {
      if (editing === "new") await api.post("/admin/portfolio", payload);
      else await api.put(`/admin/portfolio/${editing}`, payload);
      toast.success("Project saved");
      setEditing(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.title}"?`)) return;
    try {
      await api.delete(`/admin/portfolio/${p.id}`);
      setItems((ps) => ps.filter((x) => x.id !== p.id));
      toast.success("Project deleted");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (!items) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  return (
    <div data-testid="admin-portfolio-list">
      <div className="mb-6 flex justify-end">
        <button onClick={openNew} data-testid="portfolio-add-btn" className="btn-electric inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold"><Plus size={14} /> Add Project</button>
      </div>
      {items.length === 0 ? <Empty text="No portfolio projects yet." /> : (
        <div className="grid gap-5 sm:grid-cols-2">
          {items.map((p) => (
            <article key={p.id} data-testid={`portfolio-admin-row-${p.id}`} className="neu-card overflow-hidden rounded-3xl">
              {p.image_url && <img src={p.image_url} alt={p.title} className="h-36 w-full object-cover" />}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display font-semibold">{p.title}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">{p.category} {p.year && `· ${p.year}`} {p.featured && "· Featured"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} data-testid={`portfolio-edit-${p.id}`} className="neu-raised rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-300">Edit</button>
                    <button onClick={() => remove(p)} data-testid={`portfolio-delete-${p.id}`} className="neu-raised rounded-full p-2 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Project" : "Edit Project"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4" data-testid="portfolio-form">
            <input required placeholder="Project title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={INPUT} data-testid="portfolio-form-title" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder="Category (e.g. Web Applications)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={INPUT} data-testid="portfolio-form-category" />
              <input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className={INPUT} data-testid="portfolio-form-year" />
            </div>
            <input placeholder="Image URL" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className={INPUT} data-testid="portfolio-form-image" />
            <input placeholder="Live project link (https://…)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className={INPUT} data-testid="portfolio-form-link" />
            <input placeholder="GitHub repo link (https://github.com/…)" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} className={INPUT} data-testid="portfolio-form-github" />
            <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${INPUT} resize-none`} data-testid="portfolio-form-description" />
            <input placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={INPUT} data-testid="portfolio-form-tags" />
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} data-testid="portfolio-form-featured" className="h-4 w-4 accent-[#0066FF]" /> Featured project
            </label>
            <button type="submit" data-testid="portfolio-form-save" className="btn-electric w-full rounded-full px-6 py-3.5 text-sm font-semibold">Save Project</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function ServicesTab() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", slug: "", tagline: "", description: "", icon: "Globe", features: "", order: 0 };
  const [form, setForm] = useState(blank);
  const load = useCallback(() => api.get("/services").then((r) => setItems(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(blank); setEditing("new"); };
  const openEdit = (s) => { setForm({ ...s, features: (s.features || []).join("\n") }); setEditing(s.id); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, slug: form.slug || undefined, order: Number(form.order) || 0, features: form.features.split("\n").map((f) => f.trim()).filter(Boolean) };
    try {
      if (editing === "new") await api.post("/admin/services", payload);
      else await api.put(`/admin/services/${editing}`, payload);
      toast.success("Service saved");
      setEditing(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const remove = async (s) => {
    if (!window.confirm(`Delete service "${s.name}"?`)) return;
    try {
      await api.delete(`/admin/services/${s.id}`);
      setItems((xs) => xs.filter((x) => x.id !== s.id));
      toast.success("Service deleted");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (!items) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  return (
    <div data-testid="admin-services-list">
      <div className="mb-6 flex justify-end">
        <button onClick={openNew} data-testid="service-add-btn" className="btn-electric inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold"><Plus size={14} /> Add Service</button>
      </div>
      <div className="space-y-4">
        {items.map((s) => (
          <article key={s.id} data-testid={`service-admin-row-${s.id}`} className="neu-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
            <div>
              <p className="font-display font-semibold">{s.name} <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">/{s.slug}</span></p>
              <p className="mt-1 text-xs text-slate-400">{s.tagline}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openEdit(s)} data-testid={`service-edit-${s.id}`} className="neu-raised rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-300">Edit</button>
              <button onClick={() => remove(s)} data-testid={`service-delete-${s.id}`} className="neu-raised rounded-full p-2 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <Modal title={editing === "new" ? "Add Service" : "Edit Service"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4" data-testid="service-form">
            <input required placeholder="Service name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} data-testid="service-form-name" />
            <div className="grid gap-4 sm:grid-cols-2">
              <input placeholder="Slug (auto if empty)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className={INPUT} data-testid="service-form-slug" />
              <input type="number" placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className={INPUT} data-testid="service-form-order" />
            </div>
            <input placeholder="Icon (Globe, Smartphone, PanelsTopLeft, Monitor, BrainCircuit, GraduationCap, UtensilsCrossed, CalendarCheck, Settings2)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className={INPUT} data-testid="service-form-icon" />
            <input placeholder="Tagline" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={INPUT} data-testid="service-form-tagline" />
            <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${INPUT} resize-none`} data-testid="service-form-description" />
            <textarea rows={4} placeholder={"Features — one per line"} value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className={`${INPUT} resize-none`} data-testid="service-form-features" />
            <button type="submit" data-testid="service-form-save" className="btn-electric w-full rounded-full px-6 py-3.5 text-sm font-semibold">Save Service</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function TestimonialsTab() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const blank = { name: "", role: "", quote: "", rating: 5 };
  const [form, setForm] = useState(blank);
  const load = useCallback(() => api.get("/testimonials").then((r) => setItems(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const openNew = () => { setForm(blank); setEditing("new"); };
  const openEdit = (t) => { setForm({ name: t.name, role: t.role, quote: t.quote, rating: t.rating }); setEditing(t.id); };

  const save = async (e) => {
    e.preventDefault();
    const payload = { ...form, rating: Number(form.rating) || 5 };
    try {
      if (editing === "new") await api.post("/admin/testimonials", payload);
      else await api.put(`/admin/testimonials/${editing}`, payload);
      toast.success("Testimonial saved");
      setEditing(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); }
  };
  const remove = async (t) => {
    if (!window.confirm(`Delete testimonial from ${t.name}?`)) return;
    try {
      await api.delete(`/admin/testimonials/${t.id}`);
      setItems((xs) => xs.filter((x) => x.id !== t.id));
      toast.success("Testimonial deleted");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  if (!items) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  return (
    <div data-testid="admin-testimonials-list">
      <div className="mb-6 flex justify-end">
        <button onClick={openNew} data-testid="testimonial-add-btn" className="btn-electric inline-flex items-center gap-2 rounded-full px-6 py-3 text-xs font-semibold"><Plus size={14} /> Add Testimonial</button>
      </div>
      {items.length === 0 ? <Empty text="No testimonials yet — add your first client review." /> : (
        <div className="space-y-4">
          {items.map((t) => (
            <article key={t.id} data-testid={`testimonial-admin-row-${t.id}`} className="neu-card flex flex-wrap items-start justify-between gap-4 rounded-3xl p-5">
              <div className="min-w-0">
                <p className="font-display font-semibold">{t.name} <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-slate-500">{t.role}</span></p>
                <div className="mt-1 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={12} className={s < t.rating ? "fill-[#00E5FF] text-[#00E5FF]" : "text-slate-600"} />
                  ))}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(t)} data-testid={`testimonial-edit-${t.id}`} className="neu-raised rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-300">Edit</button>
                <button onClick={() => remove(t)} data-testid={`testimonial-delete-${t.id}`} className="neu-raised rounded-full p-2 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
      {editing && (
        <Modal title={editing === "new" ? "Add Testimonial" : "Edit Testimonial"} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4" data-testid="testimonial-form">
            <input required placeholder="Client name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} data-testid="testimonial-form-name" />
            <input placeholder="Role / company (e.g. Principal, PCA School)" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={INPUT} data-testid="testimonial-form-role" />
            <textarea required rows={4} placeholder="What the client said *" value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} className={`${INPUT} resize-none`} data-testid="testimonial-form-quote" />
            <select value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} className={INPUT} data-testid="testimonial-form-rating">
              {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? "s" : ""}</option>)}
            </select>
            <button type="submit" data-testid="testimonial-form-save" className="btn-electric w-full rounded-full px-6 py-3.5 text-sm font-semibold">Save Testimonial</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function SettingsTab() {
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (form.new_password.length < 8) return toast.error("New password must be at least 8 characters");
    if (form.new_password !== form.confirm) return toast.error("New passwords do not match");
    setSaving(true);
    try {
      await api.post("/auth/change-password", { current_password: form.current_password, new_password: form.new_password });
      toast.success("Password updated — use it on your next sign in");
      setForm({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg" data-testid="admin-settings">
      <form onSubmit={submit} className="neu-card rounded-3xl p-8" data-testid="password-change-form">
        <div className="mb-6 flex items-center gap-4">
          <span className="neu-pressed rounded-2xl p-3.5 text-cyan-400"><KeyRound size={22} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Change Admin Password</h3>
            <p className="mt-1 text-xs text-slate-400">Takes effect immediately. Your current session stays signed in.</p>
          </div>
        </div>
        <div className="space-y-4">
          <input required type="password" placeholder="Current password *" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} className={INPUT} data-testid="password-current-input" autoComplete="current-password" />
          <input required minLength={8} type="password" placeholder="New password (min 8 characters) *" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} className={INPUT} data-testid="password-new-input" autoComplete="new-password" />
          <input required minLength={8} type="password" placeholder="Confirm new password *" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} className={INPUT} data-testid="password-confirm-input" autoComplete="new-password" />
        </div>
        <button type="submit" disabled={saving} data-testid="password-change-submit" className="btn-electric mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
          {saving ? "Updating…" : "Update Password"}
        </button>
      </form>
    </div>
  );
}

export function CodebaseTab() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ name: "", github_url: "", description: "" });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState("");
  const load = useCallback(() => api.get("/admin/codebases").then((r) => setItems(r.data)).catch((e) => toast.error(formatApiError(e))), []);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.github_url && !file) return toast.error("Add a GitHub link or choose a ZIP file");
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("github_url", form.github_url);
      fd.append("description", form.description);
      if (file) fd.append("file", file);
      await api.post("/admin/codebases", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Codebase saved");
      setForm({ name: "", github_url: "", description: "" });
      setFile(null);
      load();
    } catch (err) { toast.error(formatApiError(err)); } finally { setSaving(false); }
  };

  const download = async (c) => {
    setDownloading(c.id);
    try {
      const res = await api.get(`/codebases/${c.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = c.original_filename || "codebase.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) { toast.error(formatApiError(err)); } finally { setDownloading(""); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.name}"? The stored file will no longer be downloadable.`)) return;
    try {
      await api.delete(`/admin/codebases/${c.id}`);
      setItems((xs) => xs.filter((x) => x.id !== c.id));
      toast.success("Codebase deleted");
    } catch (err) { toast.error(formatApiError(err)); }
  };

  const fmtSize = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);

  if (!items) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-cyan-400" /></div>;
  return (
    <div data-testid="admin-codebase">
      <form onSubmit={submit} className="neu-card mb-8 rounded-3xl p-7" data-testid="codebase-form">
        <div className="mb-5 flex items-center gap-4">
          <span className="neu-pressed rounded-2xl p-3.5 text-cyan-400"><FolderGit2 size={22} /></span>
          <div>
            <h3 className="font-display text-lg font-bold">Upload Codebase</h3>
            <p className="mt-1 text-xs text-slate-400">Link a GitHub repository, attach a ZIP of the code, or both. Private — only you can see this.</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <input required placeholder="Project name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={INPUT} data-testid="codebase-name-input" />
          <input placeholder="GitHub URL (https://github.com/…)" value={form.github_url} onChange={(e) => setForm({ ...form, github_url: e.target.value })} className={INPUT} data-testid="codebase-github-input" />
          <input placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={`${INPUT} sm:col-span-2`} data-testid="codebase-description-input" />
          <label className="neu-input flex cursor-pointer items-center justify-center gap-3 rounded-xl px-4 py-6 text-sm text-slate-400 sm:col-span-2" data-testid="codebase-file-drop">
            <Upload size={17} className="text-cyan-400" />
            {file ? `${file.name} (${fmtSize(file.size)})` : "Choose a .zip of your codebase (max 100MB)"}
            <input type="file" accept=".zip" className="hidden" data-testid="codebase-file-input" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>
        <button type="submit" disabled={saving} data-testid="codebase-submit-btn" className="btn-electric mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {saving ? "Uploading…" : "Save Codebase"}
        </button>
      </form>
      {items.length === 0 ? <Empty text="No codebases yet — link a repo or upload a ZIP above." /> : (
        <div className="space-y-4" data-testid="codebase-list">
          {items.map((c) => (
            <article key={c.id} data-testid={`codebase-row-${c.id}`} className="neu-card flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
              <div className="min-w-0">
                <p className="font-display font-semibold">{c.name}</p>
                <p className="mt-1 text-xs text-slate-400">{c.description}</p>
                <div className="mt-2 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-widest text-slate-500">
                  {c.github_url && <a href={c.github_url} target="_blank" rel="noopener noreferrer" data-testid={`codebase-github-${c.id}`} className="text-cyan-400 hover:text-cyan-300">GitHub ↗</a>}
                  {c.original_filename && <span>{c.original_filename} · {fmtSize(c.size)}</span>}
                  <span>{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {c.storage_path && (
                  <button onClick={() => download(c)} disabled={downloading === c.id} data-testid={`codebase-download-${c.id}`} className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-cyan-300 disabled:opacity-60">
                    {downloading === c.id ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} ZIP
                  </button>
                )}
                <button onClick={() => remove(c)} data-testid={`codebase-delete-${c.id}`} className="neu-raised rounded-full p-2 text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
