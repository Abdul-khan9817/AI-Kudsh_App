const ITEMS = [
  "Website Development", "Mobile Apps", "Web Applications", "Desktop Software", "AI Integration",
  "School Management", "Restaurant Systems", "Booking Platforms", "Custom Software",
  "Your Ideas. Our Technology. Real Solutions.",
];

export const Marquee = () => {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div data-testid="tech-marquee" className="relative overflow-hidden border-y border-white/5 bg-[#040814] py-6">
      <div className="ak-marquee-track flex w-max items-center">
        {[0, 1].map((half) => (
          <div key={half} className="flex items-center">
            {row.map((item, i) => (
              <span key={`${half}-${i}`} className="flex items-center whitespace-nowrap">
                <span className="font-display text-lg font-semibold uppercase tracking-[0.15em] text-slate-400">{item}</span>
                <span className="mx-8 inline-block h-1.5 w-1.5 rotate-45 bg-gradient-to-r from-[#0066FF] to-[#00E5FF]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
