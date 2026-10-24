import { Link } from "react-router-dom";

export const LogoMark = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    <defs>
      <linearGradient id="ak-grad" x1="0" y1="0" x2="48" y2="48">
        <stop stopColor="#00E5FF" />
        <stop offset="1" stopColor="#0066FF" />
      </linearGradient>
    </defs>
    <path d="M24 4 41 14v20L24 44 7 34V14L24 4Z" stroke="url(#ak-grad)" strokeWidth="2.4" />
    <path d="M18.5 15.5v17M18.5 24l11-8.5M20 24l11 8.5" stroke="url(#ak-grad)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="36" cy="12" r="2.8" fill="#00E5FF" />
  </svg>
);

export const Logo = ({ compact = false }) => (
  <Link to="/" data-testid="brand-logo" className="flex items-center gap-3 group">
    <span className="transition-transform duration-500 group-hover:rotate-[8deg]">
      <LogoMark size={compact ? 34 : 40} />
    </span>
    <span className="leading-none">
      <span className="block font-display text-xl font-extrabold tracking-wide text-white">Al-Kudsh</span>
      <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.35em] text-cyan-400">Digital Solutions</span>
    </span>
  </Link>
);
