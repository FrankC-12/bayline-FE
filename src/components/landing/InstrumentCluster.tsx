import GaugeDial from "./GaugeDial";

const metrics = [
  { value: 98, suffix: "%", label: "Disponibilidad" },
  { value: 10, suffix: "", label: "Módulos" },
  { value: 24, suffix: "/7", label: "Operación" },
];

export default function InstrumentCluster() {
  return (
    <div className="relative rounded-[28px] border border-navy/40 bg-navy p-8 shadow-2xl shadow-navy/30 sm:p-10">
      <div className="pointer-events-none absolute inset-0 rounded-[28px] bg-[radial-gradient(circle_at_top,rgba(37,87,176,0.25),transparent_60%)]" />
      <div className="relative mb-6 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-widest text-slate-400">
          Panel Bayline
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          En línea
        </span>
      </div>
      <div className="relative grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <GaugeDial key={m.label} value={m.value} suffix={m.suffix} label={m.label} />
        ))}
      </div>
    </div>
  );
}