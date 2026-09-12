import type { MaintenancePlan } from "@/types/maintenancePlan";

interface MaintenancePlanCardProps {
  plan: MaintenancePlan;
  onClick: () => void;
}

export default function MaintenancePlanCard({ plan, onClick }: MaintenancePlanCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-navy/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-blue-light px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-blue">
          {plan.brand}
        </span>
        <span className="text-xs text-steel">
          {plan.entries.length} servicio{plan.entries.length === 1 ? "" : "s"}
        </span>
      </div>

      <h3 className="mt-2 font-display text-lg font-bold text-navy">{plan.name}</h3>

      <div className="mt-4 space-y-1.5 border-t border-navy/10 pt-4">
        {plan.entries.slice(0, 3).map((entry) => (
          <div key={entry.id} className="flex items-center justify-between text-sm">
            <span className="text-navy">
              <span className="font-mono text-blue">{entry.tempario_code}</span> {entry.tempario_name}
            </span>
            <span className="shrink-0 text-xs text-steel">
              {entry.interval_km != null ? `${entry.interval_km.toLocaleString("es-VE")} km` : null}
              {entry.interval_km != null && entry.interval_months != null ? " · " : null}
              {entry.interval_months != null ? `${entry.interval_months} meses` : null}
            </span>
          </div>
        ))}
        {plan.entries.length > 3 && (
          <p className="text-xs text-steel">+{plan.entries.length - 3} más</p>
        )}
        {plan.entries.length === 0 && <p className="text-xs text-steel">Sin servicios todavía.</p>}
      </div>
    </button>
  );
}
