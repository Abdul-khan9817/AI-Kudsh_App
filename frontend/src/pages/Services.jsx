import { useEffect, useState } from "react";
import api from "@/lib/api";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { CTASection } from "@/components/home/CTASection";
import { SectionHead } from "@/components/Reveal";

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/services")
      .then((r) => setServices(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <main data-testid="services-page" className="pt-36 pb-8 lg:pt-44">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <SectionHead
          overline="Services"
          title={<>Everything Digital. <span className="ak-gradient-text">End to End.</span></>}
          sub="Pick a discipline to see how we approach it — or tell us about your project and we will recommend the right mix."
        />
        {loading ? (
          <p className="py-20 text-center font-mono text-sm text-slate-500" data-testid="services-loading">Loading services…</p>
        ) : (
          <ServicesGrid services={services} />
        )}
      </div>
      <CTASection />
    </main>
  );
}
