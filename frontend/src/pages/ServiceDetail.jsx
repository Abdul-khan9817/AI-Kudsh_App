import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import api from "@/lib/api";
import { ICONS } from "@/components/home/ServicesGrid";
import { CTASection } from "@/components/home/CTASection";
import { Reveal } from "@/components/Reveal";

export default function ServiceDetail() {
  const { slug } = useParams();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/services")
      .then((r) => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const service = services.find((s) => s.slug === slug);
  const Icon = service ? ICONS[service.icon] : null;

  if (loading) return <main className="pt-44 pb-24 text-center font-mono text-sm text-slate-500" data-testid="service-detail-loading">Loading…</main>;

  if (!service)
    return (
      <main data-testid="service-not-found" className="mx-auto max-w-3xl px-6 pt-44 pb-24 text-center">
        <h1 className="font-display text-3xl font-bold">Service Not Found</h1>
        <p className="mt-4 text-slate-400">This service may have been renamed. Browse the full list instead.</p>
        <Link to="/services" data-testid="service-back-btn" className="btn-electric mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
          <ArrowLeft size={16} /> All Services
        </Link>
      </main>
    );

  const related = services.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <main data-testid="service-detail-page" className="pt-36 pb-8 lg:pt-44">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <Reveal>
          <Link to="/services" data-testid="service-back-link" className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-cyan-300">
            <ArrowLeft size={14} /> All Services
          </Link>
          <div className="mt-8 flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            <div className="neu-raised neu-glow inline-flex rounded-3xl p-6 text-cyan-400">
              {Icon && <Icon size={40} strokeWidth={1.6} />}
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">Al-Kudsh Service</p>
              <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl" data-testid="service-detail-title">{service.name}</h1>
            </div>
          </div>
          <p className="mt-8 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg" data-testid="service-detail-description">{service.description || service.tagline}</p>
        </Reveal>

        {service.features?.length > 0 && (
          <Reveal delay={0.15} className="mt-14">
            <div className="neu-card rounded-3xl p-8 sm:p-10">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">What&apos;s Included</h2>
              <ul className="mt-7 grid gap-4 sm:grid-cols-2">
                {service.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="neu-pressed mt-0.5 rounded-full p-1.5 text-cyan-400"><Check size={13} /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link to={`/quote?service=${service.slug}`} data-testid="service-quote-btn" className="btn-electric mt-9 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
                Get a Quote for This Service <ArrowRight size={16} />
              </Link>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.2} className="mt-14">
          <h2 className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Related Services</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {related.map((r) => (
              <Link key={r.slug} to={`/services/${r.slug}`} data-testid={`related-service-${r.slug}`} className="btn-ghost rounded-full px-6 py-3 text-sm text-slate-200">
                {r.name}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
      <CTASection />
    </main>
  );
}
