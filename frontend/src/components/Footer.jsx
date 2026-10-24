import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { WhatsAppIcon } from "@/components/WhatsApp";

const SERVICE_LINKS = [
  ["Website Development", "/services/website-development"],
  ["Mobile Apps", "/services/mobile-app-development"],
  ["AI Integration", "/services/ai-integration"],
  ["Booking Platforms", "/services/booking-platforms"],
  ["Custom Software", "/services/custom-business-software"],
];

export const Footer = () => (
  <footer data-testid="site-footer" className="relative border-t border-white/5 bg-[#040814]">
    <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-12 lg:px-10">
      <div className="md:col-span-5">
        <div className="flex items-center gap-3">
          <LogoMark size={44} />
          <span className="leading-none">
            <span className="block font-display text-2xl font-extrabold tracking-wide">Al-Kudsh</span>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400">Digital Solutions</span>
          </span>
        </div>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-400">
          Your Ideas. Our Technology. Real Solutions. We craft websites, apps, AI systems, and business software that move companies forward.
        </p>
      </div>
      <div className="md:col-span-3">
        <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400">Services</h4>
        <ul className="mt-5 space-y-3">
          {SERVICE_LINKS.map(([label, to]) => (
            <li key={to}>
              <Link to={to} data-testid={`footer-link-${label.toLowerCase().replace(/\s+/g, "-")}`} className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="md:col-span-2">
        <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400">Company</h4>
        <ul className="mt-5 space-y-3">
          <li><Link to="/portfolio" data-testid="footer-link-portfolio" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">Portfolio</Link></li>
          <li><Link to="/quote" data-testid="footer-link-quote" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">Get a Quote</Link></li>
          <li><Link to="/contact" data-testid="footer-link-contact" className="text-sm text-slate-400 transition-colors duration-300 hover:text-white">Contact</Link></li>
          <li><Link to="/admin/login" data-testid="footer-link-admin" className="text-sm text-slate-500 transition-colors duration-300 hover:text-white">Admin</Link></li>
        </ul>
      </div>
      <div className="md:col-span-2">
        <h4 className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-400">Reach Us</h4>
        <ul className="mt-5 space-y-3 text-sm text-slate-400">
          <li>
            <a href="mailto:info.alkudsh9817@gmail.com" data-testid="footer-email" className="flex items-center gap-2 transition-colors duration-300 hover:text-white">
              <Mail size={14} className="shrink-0 text-cyan-400" /> info.alkudsh9817@gmail.com
            </a>
          </li>
          <li>
            <a href="https://wa.me/9779817471013" target="_blank" rel="noopener noreferrer" data-testid="footer-whatsapp" className="flex items-center gap-2 transition-colors duration-300 hover:text-white">
              <WhatsAppIcon size={14} className="shrink-0 text-cyan-400" /> +977 9817471013 (WhatsApp)
            </a>
          </li>
          <li>
            <a href="https://maps.google.com/?q=27.542617,83.056565" target="_blank" rel="noopener noreferrer" data-testid="footer-location" className="flex items-center gap-2 transition-colors duration-300 hover:text-white">
              <MapPin size={14} className="shrink-0 text-cyan-400" /> 27.5426° N, 83.0566° E
            </a>
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-white/5 py-6 text-center">
      <p className="font-mono text-xs tracking-[0.2em] text-slate-500">© 2026 AL-KUDSH — DIGITAL SOLUTIONS. ALL RIGHTS RESERVED.</p>
    </div>
  </footer>
);
