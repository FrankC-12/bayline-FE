import { CATEGORY_STYLES, categoryLabel } from "@/lib/temparios-categories";
import type { Tempario } from "@/types/tempario";

interface TemparioCardProps {
  tempario: Tempario;
  onClick: () => void;
}

export default function TemparioCard({ tempario, onClick }: TemparioCardProps) {
  const style = CATEGORY_STYLES[tempario.category];

  return (
    <button
      onClick={onClick}
      className={`flex flex-col rounded-2xl border border-l-4 border-navy/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-mono text-sm font-bold text-blue">{tempario.code}</span>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest ${style.badge}`}
        >
          {categoryLabel(tempario.category)}
        </span>
      </div>

      <h3 className="mt-2 font-display text-lg font-bold text-navy">{tempario.name}</h3>

      <div className="mt-6 flex items-end justify-between border-t border-navy/10 pt-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Horas estimadas</p>
          <p className="font-medium text-navy">{tempario.estimated_hours} h</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[11px] uppercase tracking-widest text-steel">Precio calculado</p>
          <p className="font-display text-xl font-bold text-blue">${tempario.total_price.toFixed(2)}</p>
        </div>
      </div>
    </button>
  );
}