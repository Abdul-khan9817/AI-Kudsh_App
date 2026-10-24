import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, PenTool, Code2, Rocket } from "lucide-react";
import api from "@/lib/api";
import { Hero } from "@/components/home/Hero";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { PortfolioBento } from "@/components/home/PortfolioBento";
import { Testimonials } from "@/components/home/Testimonials";
import { CTASection } from "@/components/home/CTASection";
import { Marquee } from "@/components/Marquee";
import { Reveal, SectionHead } from "@/components/Reveal";

const PROCESS = [
  { icon: Compass, title: "Discover", text: "We map your goals, users, and constraints into a sharp technical plan." },
  { icon: PenTool, title: "Design", text: "Interfaces crafted pixel by pixel — neumorphic precision, brand-true." },
  { icon: Code2, title: "Develop", text: "Clean, secure, scalable code shipped in transparent weekly sprints." },
  { icon: Rocket, title: "Deploy & Scale", text: "Launch, monitor, and evolve — we stay in your corner long after go-live." },
];

export default function Home() {
  const [services, setServices] = useState([]);
  const [portfolio, setPortfolio] = useState([]);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data)).catch(() => {});
    api.get("/portfolio").then((r) => setPortfolio(r.data)).catch(() => {});
  }, []);

  return (
    <main data-testid="home-page">
      <Hero />
      <Marquee />
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32" data-testid="services-section">
        <SectionHead
          overline="What We Build"
          title={<>Nine Disciplines. <span className="ak-gradient-text">One Standard.</span></>}
          sub="Every engagement — from a landing page to a full AI platform — gets the same obsessive engineering."
        />
        <ServicesGrid services={services} />
      </section>
      <Marquee />
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32" data-testid="portfolio-section">
        <SectionHead
          overline="Selected Work"
          title={<>Products We&apos;re <span className="ak-gradient-text">Proud Of.</span></>}
          sub="A snapshot of platforms we have designed, engineered, and shipped for ambitious teams."
        />
        <PortfolioBento items={portfolio.slice(0, 4)} />
        <Reveal className="mt-14 text-center">
          <Link to="/portfolio" data-testid="portfolio-view-all-btn" className="btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-slate-200">
            View Full Portfolio <ArrowRight size={17} />
          </Link>
        </Reveal>
      </section>
      <Testimonials />
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32" data-testid="process-section">
        <SectionHead
          overline="How We Work"
          title={<>From Idea to Impact, <span className="ak-gradient-text">In Four Moves.</span></>}
        />
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.12}>
              <div data-testid={`process-step-${i}`} className="neu-card neu-card-hover h-full rounded-3xl p-8">
                <div className="flex items-center justify-between">
                  <div className="neu-pressed inline-flex items-center justify-center rounded-2xl p-3 text-cyan-400">
                    <step.icon size={24} strokeWidth={1.8} />
                  </div>
                  <span className="font-display text-4xl font-extrabold text-white/10">0{i + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{step.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
      <CTASection />
    </main>
  );
}
