import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { Reveal, SectionHead } from "@/components/Reveal";

const INPUT = "neu-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500";
const BUDGETS = ["Under $5,000", "$5,000 – $15,000", "$15,000 – $50,000", "$50,000+", "Not sure yet"];
const TIMELINES = ["ASAP", "1 – 3 months", "3 – 6 months", "Flexible"];

export default function Quote() {
  const [params] = useSearchParams();
  const [services, setServices] = useState([]);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", company: "",
    service: "", budget: "", timeline: "", message: "",
  });

  useEffect(() => {
    api.get("/services").then((r) => {
      setServices(r.data);
      const pre = params.get("service");
      const match = r.data.find((s) => s.slug === pre);
      if (match) setForm((f) => ({ ...f, service: match.name }));
    }).catch(() => {});
  }, [params]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/quotes", form);
      toast.success("Quote request received. We will reply within 48 hours.");
      setForm({ name: "", email: "", phone: "", company: "", service: "", budget: "", timeline: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <main data-testid="quote-page" className="pt-36 pb-24 lg:pt-44">
      <div className="mx-auto max-w-3xl px-6 lg:px-10">
        <SectionHead
          overline="Project Quotation"
          title={<>Tell Us What You Want to <span className="ak-gradient-text">Build.</span></>}
          sub="Share the essentials and receive a detailed, no-obligation quotation within 48 hours."
        />
        <Reveal>
          <form onSubmit={submit} data-testid="quote-form" className="neu-card rounded-3xl p-8 sm:p-10">
            <div className="grid gap-5 sm:grid-cols-2">
              <input required minLength={2} data-testid="quote-name-input" placeholder="Your name *" value={form.name} onChange={set("name")} className={INPUT} />
              <input required type="email" data-testid="quote-email-input" placeholder="Email address *" value={form.email} onChange={set("email")} className={INPUT} />
              <input data-testid="quote-phone-input" placeholder="Phone (optional)" value={form.phone} onChange={set("phone")} className={INPUT} />
              <input data-testid="quote-company-input" placeholder="Company (optional)" value={form.company} onChange={set("company")} className={INPUT} />
              <select required data-testid="quote-service-select" value={form.service} onChange={set("service")} className={INPUT}>
                <option value="" disabled>Select a service *</option>
                {services.map((s) => <option key={s.slug} value={s.name}>{s.name}</option>)}
                <option value="Something else">Something else</option>
              </select>
              <select required data-testid="quote-budget-select" value={form.budget} onChange={set("budget")} className={INPUT}>
                <option value="" disabled>Budget range *</option>
                {BUDGETS.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <select required data-testid="quote-timeline-select" value={form.timeline} onChange={set("timeline")} className={`${INPUT} sm:col-span-2`}>
                <option value="" disabled>Ideal timeline *</option>
                {TIMELINES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea required minLength={10} rows={5} data-testid="quote-message-input" placeholder="Describe your project — goals, features, references… *" value={form.message} onChange={set("message")} className={`${INPUT} resize-none sm:col-span-2`} />
            </div>
            <button type="submit" disabled={sending} data-testid="quote-submit-btn" className="btn-electric mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:opacity-60">
              {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
              {sending ? "Sending…" : "Request My Quote"}
            </button>
            <p className="mt-4 text-center font-mono text-[11px] tracking-wider text-slate-500">Your details stay private. Average response time: under 48 hours.</p>
          </form>
        </Reveal>
      </div>
    </main>
  );
}
