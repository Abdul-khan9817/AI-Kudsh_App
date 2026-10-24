import { ArrowUpRight, Github } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const SPANS = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];

export const PortfolioBento = ({ items }) => (
  <div className="grid gap-7 lg:grid-cols-12">
    {items.map((p, i) => (
      <Reveal key={p.id || p.title} delay={(i % 2) * 0.12} className={`${SPANS[i % 4]} col-span-1`}>
        <article
          data-testid={`portfolio-card-${(p.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          className="neu-card neu-card-hover group relative h-full overflow-hidden rounded-3xl"
        >
          <div className="relative h-72 overflow-hidden sm:h-80">
            <img
              src={p.image_url}
              alt={p.title}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128] via-[#0A1128]/30 to-transparent" />
            <span className="neu-raised absolute left-5 top-5 rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-300">
              {p.category}
            </span>
          </div>
          <div className="relative -mt-14 p-7">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-xl font-semibold text-white sm:text-2xl">{p.title}</h3>
              {p.link && (
                <a
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`portfolio-live-${i}`}
                  aria-label={`Open live project: ${p.title}`}
                  className="neu-pressed mt-1 rounded-full p-2.5 text-slate-400 transition-colors duration-300 hover:text-cyan-300"
                >
                  <ArrowUpRight size={16} />
                </a>
              )}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">{p.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {(p.tags || []).map((t) => (
                <span key={t} className="rounded-full border border-white/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-slate-400">{t}</span>
              ))}
              {p.github_url && (
                <a
                  href={p.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`portfolio-github-${i}`}
                  aria-label={`View source code on GitHub: ${p.title}`}
                  title="View codebase on GitHub"
                  className="neu-raised inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-slate-300 transition-all duration-300 hover:text-white hover:shadow-[0_0_18px_rgba(0,102,255,0.25)]"
                >
                  <Github size={14} /> Code
                </a>
              )}
              {p.year && <span className="ml-auto font-mono text-xs text-slate-500">{p.year}</span>}
            </div>
          </div>
        </article>
      </Reveal>
    ))}
  </div>
);
