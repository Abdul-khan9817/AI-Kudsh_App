import { motion } from "framer-motion";

export const Reveal = ({ children, delay = 0, className = "", ...rest }) => (
  <motion.div
    className={className}
    initial={{ opacity: 0, y: 36 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-80px" }}
    transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    {...rest}
  >
    {children}
  </motion.div>
);

export const SectionHead = ({ overline, title, sub, align = "center" }) => (
  <Reveal className={`mx-auto mb-16 max-w-2xl ${align === "center" ? "text-center" : "text-left"}`}>
    <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400" data-testid="section-overline">{overline}</p>
    <h2 className="mt-4 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">{title}</h2>
    {sub && <p className="mt-4 text-base leading-relaxed text-slate-400">{sub}</p>}
  </Reveal>
);
