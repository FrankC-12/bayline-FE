import EvidenceGallery from "@/components/inspections/EvidenceGallery";
import type { DetailedInspection } from "@/hooks/useDetailedInspection";
import { formatCount } from "@/lib/format";
const LABELS: Record<string, string> = {
  interior: "Interior del vehículo",
  seats: "Asientos",
  seatbelts: "Cinturones de seguridad",
  dashboard: "Tablero",
  upholstery: "Tapicería",
  display: "Pantalla",
  wipers: "Limpiaparabrisas",
  mirrors: "Retrovisores",
  air_conditioning: "A/C",
  air_conditioning_filter: "Filtro del A/C",
  parking_brake: "Freno de mano",
  pedal: "Pedal",
  dashboard_warning_lights: "Testigos del tablero",
  lights: "Luces",
  horn: "Claxon",
  windows: "Ventanas",
  engine: "Compartimiento del motor",
  underbody: "Debajo del vehículo",
  tires: "Neumáticos",
  brakes: "Frenos",
  fluids: "Fluidos y niveles",
  engine_oil: "Aceite del motor",
  coolant: "Refrigerante",
  brake_fluid: "Líquido de frenos",
  clutch_fluid: "Líquido de embrague",
  transmission_fluid: "Fluido de transmisión",
  power_steering: "Dirección hidráulica",
  washer_fluid: "Limpiaparabrisas",
  level: "Nivel",
  condition: "Condición",
  color: "Color",
  notes: "Observaciones",
  leaks: "Fugas",
  accessory_belt: "Correa de accesorio",
  air_filter: "Filtro de aire",
  battery: "Batería",
  battery_voltage: "Tensión de batería (V)",
  steering_box: "Cajetín de dirección",
  tie_rod_ends: "Terminales",
  dust_boots: "Guardapolvos",
  pipes: "Tuberías",
  exhaust_pipe: "Tubo de escape",
  suspension: "Suspensiones",
  tripod_joints: "Tripoides",
  front_left: "Delantero izquierdo",
  front_right: "Delantero derecho",
  rear_left: "Trasero izquierdo",
  rear_right: "Trasero derecho",
  spare: "Repuesto",
  pressure: "Presión (psi)",
  tread_depth: "Profundidad (mm)",
  front_pads: "Pastillas delanteras",
  front_shoes: "Bandas delanteras",
  rear_pads: "Pastillas traseras",
  rear_shoes: "Bandas traseras",
};
const VALUES: Record<string, string> = {
  bien: "Bien",
  regular: "Regular",
  defectuoso: "Defectuoso",
  cargada: "Cargada",
  descargada: "Descargada",
  no_aplica: "No aplica",
  bajo: "Bajo",
  normal: "Normal",
  alto: "Alto",
};
function label(key: string) {
  const normalized = key.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return LABELS[normalized] ?? key.replaceAll("_", " ");
}
export function InspectionFields({
  data,
  omitDepth = false,
}: {
  data: Record<string, unknown>;
  omitDepth?: boolean;
}) {
  return (
    <dl className="space-y-2">
      {Object.entries(data)
        .filter(
          ([key]) =>
            !["photo_urls", "photo_url", "photos"].includes(key) &&
            (!omitDepth || key !== "tread_depth"),
        )
        .map(([key, value]) => (
          <div key={key}>
            {value && typeof value === "object" ? (
              <>
                <dt className="mt-3 font-semibold text-navy">{label(key)}</dt>
                <dd className="mt-2 border-l-2 border-blue/10 pl-3">
                  <InspectionFields
                    data={value as Record<string, unknown>}
                    omitDepth={omitDepth}
                  />
                </dd>
              </>
            ) : (
              <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <dt>{label(key)}</dt>
                <dd className="max-w-full whitespace-pre-wrap break-words font-medium text-navy">
                  {value == null
                    ? "Sin registrar"
                    : typeof value === "number"
                      ? formatCount(value)
                      : (VALUES[String(value)] ?? String(value))}
                </dd>
              </div>
            )}
          </div>
        ))}
    </dl>
  );
}
export function inspectionPhotos(data: unknown): { url: string }[] {
  if (!data || typeof data !== "object") return [];
  return Object.entries(data).flatMap(([key, value]) =>
    ["photo_urls", "photos"].includes(key) && Array.isArray(value)
      ? value
          .filter((v): v is string => typeof v === "string")
          .map((url) => ({ url }))
      : key === "photo_url" && typeof value === "string"
        ? [{ url: value }]
        : inspectionPhotos(value),
  );
}
export default function InspectionReadout({
  inspection,
}: {
  inspection: DetailedInspection;
}) {
  return (
    <div className="mt-4 space-y-5 text-sm text-steel">
      <section className="rounded-xl border border-navy/10 p-4">
        <h3 className="mb-2 font-semibold text-navy">
          Observaciones del técnico
        </h3>
        <p className="whitespace-pre-wrap">
          {inspection.data.observations || "Sin observaciones generales."}
        </p>
      </section>
      {Object.entries(inspection.data)
        .filter(
          ([key, value]) =>
            !["observations", "photo_urls", "photos"].includes(key) &&
            value &&
            typeof value === "object" &&
            Object.keys(value).length > 0,
        )
        .map(([key, value]) => (
          <section key={key} className="rounded-xl border border-navy/10 p-4">
            <h3 className="mb-3 font-semibold text-navy">{label(key)}</h3>
            <InspectionFields
              data={value as Record<string, unknown>}
              omitDepth
            />
          </section>
        ))}
      <EvidenceGallery
        files={[
          ...inspectionPhotos(inspection.data),
          ...(inspection.annexes ?? []),
        ]}
        title="Fotos y anexos del técnico"
      />
    </div>
  );
}
