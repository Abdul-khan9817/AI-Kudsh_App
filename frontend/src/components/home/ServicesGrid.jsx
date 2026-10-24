import { Link } from "react-router-dom";
import { ArrowUpRight, BrainCircuit, CalendarCheck, Globe, GraduationCap, Monitor, PanelsTopLeft, Settings2, Smartphone, UtensilsCrossed } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export const ICONS = { Globe, Smartphone, PanelsTopLeft, Monitor, BrainCircuit, GraduationCap, UtensilsCrossed, CalendarCheck, Settings2 };

export const ServicesGrid = ({ services }) => (
  <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
    {services.map((s, i) => {
      const Icon = ICONS[s.icon] || Globe;
      return (
        <Reveal key={s.id || s.slug} delay={(i % 3) * 0.1}>
          <Link
            to={`/services/${s.slug}`}
            data-testid={`service-card-${s.slug}`}
            className="neu-card neu-card-hover group flex h-full flex-col rounded-3xl p-8"
          >
            <div className="neu-pressed mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl text-cyan-400 transition-colors duration-300 group-hover:text-[#00E5FF]">
              <Icon size={26} strokeWidth={1.8} />
            </div>
            <h3 className="font-display text-xl font-semibold text-white">{s.name}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-400">{s.tagline}</p>
            <span className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-slate-500 transition-colors duration-300 group-hover:text-cyan-300">
              Explore <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Link>
        </Reveal>
      );
    })}
  </div>
);
