import { formatCount, formatEntryDate } from "@/lib/format";
import type { WarrantyClaim } from "@/types/warrantyClaim";
export default function WarrantyCoverage({
  assessment,
  note,
}: {
  assessment: WarrantyClaim["warranty_assessment"];
  note?: string;
}) {
  if (!assessment)
    return (
      <p className="text-sm text-steel">
        Sin condiciones de garantía registradas para verificar cobertura.
      </p>
    );
  if (!assessment.applicable)
    return (
      <p className="rounded-xl bg-blue-light/40 p-4 text-sm text-navy">
        Campaña o recall: su autorización se revisa fuera de la cobertura de
        garantía habitual.
      </p>
    );
  const bars = [
    assessment.time
      ? {
          label: "Tiempo",
          used: assessment.time.used,
          limit: assessment.time.limit,
          unit: "días",
          valid: assessment.time.valid,
          expires: `Vence el ${formatEntryDate(assessment.time.expires_at)}`,
        }
      : null,
    assessment.distance
      ? {
          label: "Kilometraje",
          used: assessment.distance.used,
          limit: assessment.distance.limit,
          unit: "km",
          valid: assessment.distance.valid,
          expires: `Vence a los ${formatCount(assessment.distance.expiration_mileage)} km`,
        }
      : null,
  ].filter((bar): bar is NonNullable<typeof bar> => !!bar);
  return (
    <section className="space-y-4 rounded-xl border border-navy/10 p-4">
      <h3 className="font-semibold text-navy">
        ¿Está en garantía?{" "}
        <span
          className={`ml-2 rounded-full px-2 py-1 text-xs ${assessment.valid === true ? "bg-emerald-100 text-emerald-800" : assessment.valid === false ? "bg-red-100 text-red-800" : "bg-slate-100 text-steel"}`}
        >
          {assessment.valid === true
            ? "Sí"
            : assessment.valid === false
              ? "No"
              : "Sin datos suficientes"}
        </span>
      </h3>
      {!assessment.time && (
        <p className="text-xs text-steel">Sin límite temporal registrado.</p>
      )}
      {!assessment.distance && (
        <p className="text-xs text-steel">
          Sin límite de kilometraje o sin lectura suficiente para calcularlo.
        </p>
      )}
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-2 flex justify-between gap-3 text-xs">
            <span>{bar.label}</span>
            <strong>
              {formatCount(bar.used)} de {formatCount(bar.limit)} {bar.unit}
            </strong>
          </div>
          <div
            role="progressbar"
            aria-label={bar.label}
            aria-valuemin={0}
            aria-valuemax={Math.max(1, bar.limit)}
            aria-valuenow={Math.min(bar.used, Math.max(1, bar.limit))}
            aria-valuetext={`${formatCount(bar.used)} de ${formatCount(bar.limit)} ${bar.unit}`}
            className="h-2 overflow-hidden rounded-full bg-slate-100"
          >
            <div
              className={`h-full rounded-full ${bar.valid ? "bg-emerald-500" : "bg-red-500"}`}
              style={{
                width: `${bar.limit > 0 ? Math.min(100, (100 * bar.used) / bar.limit) : 100}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-steel">{bar.expires}</p>
        </div>
      ))}
      {note && <p className="text-xs text-steel">{note}</p>}
    </section>
  );
}
