import { Link } from "react-router-dom";
import { ArrowRight, MessageSquare } from "lucide-react";
import { Reveal } from "@/components/Reveal";

export const CTASection = () => (
  <section className="relative px-6 py-24 lg:px-10 lg:py-32">
    <Reveal className="mx-auto max-w-5xl">
      <div className="neu-card neu-glow relative overflow-hidden rounded-[2.5rem] px-8 py-16 text-center sm:px-16">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[480px] -translate-x-1/2 rounded-full bg-[#0066FF]/25 blur-[100px]" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400">Let&apos;s Build Together</p>
        <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
          Ready to Move Your Business <span className="ak-gradient-text">Forward?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-400">
          Tell us about your idea and get a detailed project quotation within 48 hours. No obligations — just a clear plan.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/quote" data-testid="cta-quote-btn" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
            Request a Quote <ArrowRight size={17} />
          </Link>
          <Link to="/contact" data-testid="cta-contact-btn" className="btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-slate-200">
            <MessageSquare size={17} /> Talk to Us
          </Link>
        </div>
      </div>
    </Reveal>
  </section>
);
