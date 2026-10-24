import { useEffect, useState } from "react";
import { Star, Quote as QuoteIcon } from "lucide-react";
import api from "@/lib/api";
import { Reveal, SectionHead } from "@/components/Reveal";

export const Testimonials = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/testimonials").then((r) => setItems(r.data)).catch(() => {});
  }, []);

  if (!items.length) return null;

  return (
    <section data-testid="testimonials-section" className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
      <SectionHead
        overline="Client Voices"
        title={<>Trusted by People <span className="ak-gradient-text">We Build For.</span></>}
        sub="Real words from real clients — the reason we obsess over every pixel and every query."
      />
      <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t, i) => (
          <Reveal key={t.id} delay={(i % 3) * 0.1}>
            <figure data-testid={`testimonial-card-${i}`} className="neu-card neu-card-hover flex h-full flex-col rounded-3xl p-8">
              <div className="flex items-center justify-between">
                <div className="neu-pressed rounded-2xl p-3 text-cyan-400"><QuoteIcon size={20} /></div>
                <div className="flex gap-1" aria-label={`${t.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} size={14} className={s < t.rating ? "fill-[#00E5FF] text-[#00E5FF]" : "text-slate-600"} />
                  ))}
                </div>
              </div>
              <blockquote className="mt-6 flex-1 text-sm leading-relaxed text-slate-300">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-6 border-t border-white/5 pt-5">
                <p className="font-display text-base font-semibold text-white">{t.name}</p>
                {t.role && <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{t.role}</p>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
