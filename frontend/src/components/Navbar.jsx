import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";

const LINKS = [
  { to: "/services", label: "Services", testid: "nav-link-services" },
  { to: "/portfolio", label: "Portfolio", testid: "nav-link-portfolio" },
  { to: "/contact", label: "Contact", testid: "nav-link-contact" },
];

export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      data-testid="site-nav"
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-[#0A1128]/80 backdrop-blur-xl shadow-[0_8px_32px_rgba(4,8,20,0.6)]" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
        <Logo compact={scrolled} />
        <nav className="hidden items-center gap-2 md:flex">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={l.testid}
              className={({ isActive }) =>
                `rounded-full px-5 py-2 text-sm font-medium transition-colors duration-300 ${
                  isActive ? "text-cyan-300" : "text-slate-300 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
          <Link
            to="/quote"
            data-testid="nav-cta-quote"
            className="btn-electric ml-3 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          >
            Get a Quote <ArrowUpRight size={16} />
          </Link>
        </nav>
        <button
          data-testid="mobile-menu-toggle"
          onClick={() => setOpen(!open)}
          className="neu-raised rounded-xl p-2.5 text-white md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-white/5 bg-[#0A1128]/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-2 px-6 py-6">
              {LINKS.map((l) => (
                <Link key={l.to} to={l.to} data-testid={`mobile-${l.testid}`} className="neu-pressed rounded-xl px-5 py-3 text-sm font-medium text-slate-200">
                  {l.label}
                </Link>
              ))}
              <Link to="/quote" data-testid="mobile-nav-cta-quote" className="btn-electric mt-2 rounded-xl px-5 py-3 text-center text-sm font-semibold">
                Get a Quote
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};
