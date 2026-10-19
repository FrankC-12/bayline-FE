"use client";
import Modal from "@/components/common/Modal";
import Image from "next/image";
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
}: {
  kind: "preliminary" | "detailed" | null;
  onClose: () => void;
  preliminary: Inspection | null;
  detailed: DetailedInspection | null;
  inspector: string;
  technician: string;
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
                    <a
                      href={d.photo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-blue underline"
                    >
                      Ver foto del daño
                    </a>
                  )}
                </div>
              ))}
            </section>
            <section>
              <h3 className="font-semibold text-navy">
                Fotos de la inspección · {preliminary.photo_urls.length}
              </h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {preliminary.photo_urls.map((url, i) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-xl border border-navy/10"
                  >
                    <Image
                      src={url}
                      unoptimized
                      width={640}
                      height={360}
                      alt={`Inspección preliminar, foto ${i + 1}`}
                      className="h-48 w-full object-contain bg-slate-50"
                    />
                  </a>
                ))}
              </div>
            </section>
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
