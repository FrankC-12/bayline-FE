"use client";
import { useState } from "react";
import { downloadVehicleDocument } from "@/lib/api/concesionario";
import { downloadBlob } from "@/lib/download";
import type { DealershipVehicle } from "@/types/concesionario";
import { documentLabels } from "./VehicleSpecificationsFields";
export default function VehicleRegistrationDetails({
  vehicle,
}: {
  vehicle: DealershipVehicle;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function download(kind: string) {
    setBusy(true);
    setError("");
    try {
      const blob = await downloadVehicleDocument(vehicle.id, kind);
      const ext = blob.type.includes("pdf")
        ? "pdf"
        : blob.type.split("/")[1] || "bin";
      downloadBlob(blob, `${vehicle.sku}-${kind}.${ext}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-4 rounded-2xl border border-navy/10 p-4">
      <h3 className="font-semibold text-navy">Características y documentos</h3>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        {[
          ["Motor", vehicle.engine_type],
          ["Asientos", vehicle.seats],
          ["Tapicería", vehicle.upholstery],
          ...(vehicle.condition === "usado"
            ? [["Dueños anteriores", vehicle.previous_owners]]
            : []),
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-steel">{label}</dt>
            <dd className="font-medium text-navy">
              {value ?? "No registrado"}
            </dd>
          </div>
        ))}
      </dl>
      {vehicle.condition === "usado" && (
        <div className="space-y-2 border-t pt-3">
          {Object.entries(documentLabels).map(([kind, label]) => (
            <div
              key={kind}
              className="flex items-center justify-between text-sm"
            >
              <span>{label}</span>
              {vehicle.registration_documents?.[kind] ? (
                <button
                  disabled={busy}
                  onClick={() => void download(kind)}
                  className="text-blue underline"
                >
                  Ver documento
                </button>
              ) : (
                <span className="text-amber-700">Pendiente</span>
              )}
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
