const stats = [
  { value: "10", label: "Módulos" },
  { value: "1", label: "Plataforma" },
  { value: "Multi-tenant", label: "Arquitectura" },
  { value: "Odoo", label: "Integración ERP" },
];

export default function StatsStrip() {
  return (
    <section className="border-y border-navy/10 bg-navy">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/10 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="px-6 py-6 text-center">
            <p className="font-display text-xl font-bold text-white sm:text-2xl">{s.value}</p>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-slate-400">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}