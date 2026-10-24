import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight, BrainCircuit, Database, Rocket } from "lucide-react";
import api from "@/lib/api";

const lineVariant = {
  hidden: { y: "115%" },
  show: (i) => ({ y: "0%", transition: { duration: 1, delay: 0.2 + i * 0.16, ease: [0.22, 1, 0.36, 1] } }),
};

const CODE_LINES = [
  ['const project = await alkudsh.build({', "text-slate-300"],
  ['  idea: "your-vision",', "text-cyan-300"],
  ['  stack: ["React", "FastAPI", "MongoDB"],', "text-blue-400"],
  ["  ai: true, secure: true,", "text-slate-400"],
  ["});", "text-slate-300"],
  ["// → deployed & scaling", "text-emerald-400"],
];

export const Hero = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yCard = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [live, setLive] = useState(null);

  useEffect(() => {
    api.get("/stats").then((r) => setLive(r.data)).catch(() => {});
  }, []);

  const stats = [
    [`${live?.projects ?? 1}+`, "Projects Delivered"],
    [`${live?.services ?? 9}`, "Service Lines"],
    ["100%", "Client Commitment"],
    ["24/7", "Support Coverage"],
  ];

  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ rx: -py * 10, ry: px * 12 });
  };

  return (
    <section ref={ref} data-testid="hero-section" className="relative overflow-hidden pt-36 pb-20 lg:pt-44 lg:pb-28">
      <div className="ak-grid-bg absolute inset-0" />
      <motion.div style={{ y: yGlow }} className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-[#0066FF]/20 blur-[140px]" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-12 lg:px-10">
        <div className="lg:col-span-7">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-5 py-2 backdrop-blur-md">
            <span className="ak-pulse-dot inline-block h-2 w-2 rounded-full bg-cyan-400" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-300">Al-Kudsh · Digital Solutions</span>
          </motion.div>
          <h1 data-testid="hero-headline" className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            {[
              <>We Build <span className="ak-gradient-text">Digital Solutions</span></>,
              <>That Move Your Business</>,
              <><span className="ak-gradient-text">Forward.</span></>,
            ].map((line, i) => (
              <span key={i} className="block overflow-hidden pb-1">
                <motion.span custom={i} variants={lineVariant} initial="hidden" animate="show" className="block">
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.85 }} className="mt-7 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
            Your Ideas. Our Technology. Real Solutions. From websites and mobile apps to AI systems and custom business software — engineered with precision, delivered with care.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 1 }} className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/quote" data-testid="hero-cta-quote" className="btn-electric inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold">
              Start Your Project <ArrowRight size={17} />
            </Link>
            <Link to="/services" data-testid="hero-cta-services" className="btn-ghost inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-semibold text-slate-200">
              Explore Services <ArrowUpRight size={17} />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 1.2 }} className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.map(([num, label], i) => (
              <div key={i} data-testid={`hero-stat-${i}`} className="neu-raised rounded-2xl px-5 py-4">
                <p className="font-display text-2xl font-extrabold ak-gradient-text">{num}</p>
                <p className="mt-1 text-xs text-slate-400">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
        <motion.div style={{ y: yCard }} className="lg:col-span-5" initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <div style={{ perspective: 1200 }}>
            <div
              data-testid="hero-code-card"
              onMouseMove={onMove}
              onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
              style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
              className="neu-card neu-glow relative rounded-3xl p-8 transition-transform duration-200 will-change-transform"
            >
              <div className="mb-6 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                <span className="ml-3 font-mono text-xs text-slate-500">alkudsh.build.ts</span>
              </div>
              <pre className="font-mono text-sm leading-8">
                {CODE_LINES.map(([text, cls], i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 + i * 0.12 }} className={cls}>{text}</motion.div>
                ))}
              </pre>
              <div className="ak-float absolute -left-6 -top-6 neu-raised rounded-2xl p-3 text-cyan-400"><BrainCircuit size={22} /></div>
              <div className="ak-float absolute -right-5 top-1/3 neu-raised rounded-2xl p-3 text-blue-400" style={{ animationDelay: "1.2s" }}><Database size={22} /></div>
              <div className="ak-float absolute -bottom-6 left-1/4 neu-raised rounded-2xl p-3 text-cyan-300" style={{ animationDelay: "2s" }}><Rocket size={22} /></div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
