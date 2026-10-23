"use client";
import Modal from "@/components/common/Modal";
import EvidenceGallery from "@/components/inspections/EvidenceGallery";
import { InspectionFields, inspectionPhotos } from "./InspectionReadout";
import InspectionReadout from "./InspectionReadout";
import VehicleDamageMap from "@/components/inspections/VehicleDamageMap";
import { formatEntryDateTime } from "@/lib/format";
import type { Inspection } from "@/types/inspection";
import type { DetailedInspection } from "@/hooks/useDetailedInspection";
export default function InspectionRecordModal({
  kind,
  onClose,
  preliminary,
  detailed,
  inspector,
  technician,
  loading = false,
  error,
  onRetry,
}: {
  kind: "preliminary" | "detailed" | null;
  onClose: () => void;
  preliminary: Inspection | null;
  detailed: DetailedInspection | null;
  inspector: string;
  technician: string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  return (
    <Modal
      open={kind !== null}
      onClose={onClose}
      title={
        kind === "preliminary"
          ? "Registro de inspección preliminar"
          : "Registro de inspección minuciosa"
      }
      description="Formulario completo asociado a esta ODS · consulta del registro"
      size="xl"
    >
      <div className="space-y-5 p-5 sm:p-7">
        {loading && (
          <p role="status" className="text-sm text-steel">
            Actualizando registro…
          </p>
        )}
        {error && (
          <div
            role="alert"
            className="rounded-xl bg-red-50 p-3 text-sm text-red-800"
          >
            {error}{" "}
            <button type="button" onClick={onRetry} className="ml-2 underline">
              Reintentar
            </button>
          </div>
        )}
        {kind === "preliminary" && preliminary ? (
          <>
            <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              {[
                { label: "Inspector", value: inspector },
                {
                  label: "Estado",
                  value:
                    preliminary.status === "completada"
                      ? "Completada"
                      : "En proceso",
                },
                {
                  label: "Kilometraje",
                  value:
                    preliminary.mileage == null
                      ? "Sin registrar"
                      : `${preliminary.mileage.toLocaleString("es-VE")} km`,
                },
                {
                  label: "Registrada",
                  value: formatEntryDateTime(preliminary.created_at),
                },
                {
                  label: "Última actualización",
                  value: formatEntryDateTime(preliminary.updated_at),
                },
              ].map((v) => (
                <div key={v.label}>
                  <dt className="text-xs text-steel">{v.label}</dt>
                  <dd className="mt-1 font-semibold text-navy">{v.value}</dd>
                </div>
              ))}
            </dl>
            <section>
              <h3 className="font-semibold text-navy">Notas de recepción</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-steel">
                {preliminary.notes || "Sin notas registradas."}
              </p>
            </section>
            <section>
              <h3 className="mb-3 font-semibold text-navy">
                Daños registrados · {preliminary.damages.length}
              </h3>
              <VehicleDamageMap
                damages={preliminary.damages}
                editable={false}
              />
              {preliminary.damages.map((d, i) => (
                <div
                  key={d.id}
                  className="mt-3 rounded-xl border border-navy/10 p-4 text-sm"
                >
                  <p className="font-semibold text-navy">
                    {i + 1}. {d.zone.replaceAll("_", " ")} ·{" "}
                    {d.kind.replaceAll("_", " ")} · {d.severity}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-steel">
                    {d.description || "Sin descripción adicional."}
                  </p>
                  {d.photo_url && (
                    <div className="mt-3">
                      <EvidenceGallery
                        files={[{ url: d.photo_url }]}
                        title="Foto del daño"
                      />
                    </div>
                  )}
                </div>
              ))}
            </section>
            <section>
              <h3 className="mb-3 font-semibold text-navy">
                Interior del vehículo
              </h3>
              {preliminary.interior &&
              Object.keys(preliminary.interior).length ? (
                <InspectionFields data={preliminary.interior} />
              ) : (
                <p className="text-sm text-steel">
                  Sin datos de interior registrados desde la app.
                </p>
              )}
            </section>
            {preliminary.fluids &&
              Object.keys(preliminary.fluids).length > 0 && (
                <section>
                  <h3 className="mb-3 font-semibold text-navy">
                    Fluidos y niveles de recepción
                  </h3>
                  <InspectionFields data={preliminary.fluids} />
                </section>
              )}
            {preliminary.mileage_correction_reason && (
              <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                Corrección de kilometraje:{" "}
                {preliminary.mileage_correction_reason}
              </p>
            )}
            <EvidenceGallery
              files={[
                ...(preliminary.photo_urls ?? []).map((url) => ({ url })),
                ...inspectionPhotos(preliminary.fluids),
                ...inspectionPhotos(preliminary.interior),
              ]}
              title="Fotos de la inspección"
            />
          </>
        ) : kind === "detailed" && detailed ? (
          <>
            <p className="rounded-xl bg-slate-50 p-4 text-sm text-navy">
              Técnico: <b>{technician}</b> ·{" "}
              {detailed.status === "completada" ? "Completada" : "En proceso"} ·{" "}
              {detailed.completed_steps}/{detailed.total_steps} secciones
              completas
            </p>
            <dl className="grid gap-4 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
              {[
                { label: "Registrada", value: detailed.created_at },
                { label: "Última actualización", value: detailed.updated_at },
                { label: "Finalizada", value: detailed.completed_at },
              ]
                .filter((v) => v.value)
                .map((v) => (
                  <div key={v.label}>
                    <dt className="text-xs text-steel">{v.label}</dt>
                    <dd className="mt-1 font-semibold text-navy">
                      {formatEntryDateTime(v.value!)}
                    </dd>
                  </div>
                ))}
            </dl>
            <InspectionReadout inspection={detailed} />
          </>
        ) : (
          <p className="text-sm text-steel">
            Aún no hay una inspección registrada.
          </p>
        )}
      </div>
    </Modal>
  );
}
