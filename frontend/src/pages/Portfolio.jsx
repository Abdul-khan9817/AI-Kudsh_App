import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { PortfolioBento } from "@/components/home/PortfolioBento";
import { CTASection } from "@/components/home/CTASection";
import { SectionHead } from "@/components/Reveal";

export default function Portfolio() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/portfolio")
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => ["All", ...new Set(items.map((p) => p.category).filter(Boolean))], [items]);
  const visible = filter === "All" ? items : items.filter((p) => p.category === filter);

  return (
    <main data-testid="portfolio-page" className="pt-36 pb-8 lg:pt-44">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHead
          overline="Portfolio"
          title={<>Work That <span className="ak-gradient-text">Speaks For Itself.</span></>}
          sub="Real products, real results. Filter by discipline to see what we have shipped."
        />
        <div className="mb-12 flex flex-wrap justify-center gap-3" data-testid="portfolio-filters">
          {categories.map((c) => (
            <button
              key={c}
              data-testid={`filter-${c.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              onClick={() => setFilter(c)}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
                filter === c ? "btn-electric text-white" : "neu-raised text-slate-400 hover:text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        {loading ? (
          <p className="py-20 text-center font-mono text-sm text-slate-500" data-testid="portfolio-loading">Loading projects…</p>
        ) : visible.length === 0 ? (
          <p className="py-20 text-center text-slate-400" data-testid="portfolio-empty">No projects in this category yet.</p>
        ) : (
          <PortfolioBento items={visible} />
        )}
      </div>
      <CTASection />
    </main>
  );
}
