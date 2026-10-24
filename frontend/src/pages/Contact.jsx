import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Send, Loader2, Mail, MapPin, ArrowRight } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { Reveal, SectionHead } from "@/components/Reveal";
import { WhatsAppIcon } from "@/components/WhatsApp";

const INPUT = "neu-input w-full rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-500";

const CHANNELS = [
  { icon: Mail, label: "Email", value: "info.alkudsh9817@gmail.com", href: "mailto:info.alkudsh9817@gmail.com", testid: "contact-email" },
  { icon: WhatsAppIcon, label: "Call / WhatsApp", value: "+977 9817471013", href: "https://wa.me/9779817471013", testid: "contact-whatsapp" },
  { icon: MapPin, label: "Location", value: "27.5426° N, 83.0566° E · View Map", href: "https://maps.google.com/?q=27.542617,83.056565", testid: "contact-location" },
];

export default function Contact() {
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/contact", form);
      toast.success("Message sent. We will get back to you shortly.");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      toast.error(formatApiError(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <main data-testid="contact-page" className="pt-36 pb-24 lg:pt-44">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <SectionHead
          overline="Contact"
          title={<>Start the <span className="ak-gradient-text">Conversation.</span></>}
          sub="Questions, ideas, or a project in mind? Reach us directly — or request a structured quote."
        />
        <div className="grid gap-7 lg:grid-cols-5">
          <Reveal className="lg:col-span-2">
            <div className="flex h-full flex-col gap-5">
              {CHANNELS.map((c) => (
                <a key={c.label} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" data-testid={c.testid} className="neu-card neu-card-hover flex items-center gap-5 rounded-3xl p-6">
                  <span className="neu-pressed rounded-2xl p-3.5 text-cyan-400"><c.icon size={22} /></span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">{c.label}</p>
                    <p className="mt-1 text-sm font-medium text-white">{c.value}</p>
                  </div>
                </a>
              ))}
              <div className="neu-card overflow-hidden rounded-3xl" data-testid="contact-map">
                <iframe
                  title="Al-Kudsh location map"
                  src="https://maps.google.com/maps?q=27.542617,83.056565&z=14&output=embed"
                  className="h-64 w-full border-0"
                  loading="lazy"
                />
              </div>
              <Link to="/quote" data-testid="contact-quote-link" className="neu-card neu-card-hover group flex items-center justify-between rounded-3xl p-6">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-slate-500">Have a project?</p>
                  <p className="mt-1 text-sm font-medium text-white">Request a detailed quotation</p>
                </div>
                <span className="neu-pressed rounded-full p-3 text-cyan-400 transition-transform duration-300 group-hover:translate-x-1"><ArrowRight size={17} /></span>
              </Link>
            </div>
          </Reveal>
          <Reveal delay={0.15} className="lg:col-span-3">
            <form onSubmit={submit} data-testid="contact-form" className="neu-card h-full rounded-3xl p-8 sm:p-10">
              <div className="grid gap-5 sm:grid-cols-2">
                <input required minLength={2} data-testid="contact-name-input" placeholder="Your name *" value={form.name} onChange={set("name")} className={INPUT} />
                <input required type="email" data-testid="contact-email-input" placeholder="Email address *" value={form.email} onChange={set("email")} className={INPUT} />
                <input data-testid="contact-subject-input" placeholder="Subject" value={form.subject} onChange={set("subject")} className={`${INPUT} sm:col-span-2`} />
                <textarea required minLength={5} rows={7} data-testid="contact-message-input" placeholder="Your message *" value={form.message} onChange={set("message")} className={`${INPUT} resize-none sm:col-span-2`} />
              </div>
              <button type="submit" disabled={sending} data-testid="contact-submit-btn" className="btn-electric mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-8 py-4 text-sm font-semibold disabled:opacity-60">
                {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                {sending ? "Sending…" : "Send Message"}
              </button>
            </form>
          </Reveal>
        </div>
      </div>
    </main>
  );
}
