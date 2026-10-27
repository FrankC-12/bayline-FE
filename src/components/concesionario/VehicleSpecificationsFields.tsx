"use client";
import { NumberInput } from "@/components/ui/NumberInput";
export interface Specifications {
  engine_type: string;
  seats: string;
  upholstery: string;
  previous_owners: string;
}
export const emptySpecifications: Specifications = {
  engine_type: "",
  seats: "",
  upholstery: "",
  previous_owners: "",
};
export const documentLabels = {
  titulo: "Título de propiedad",
  experticia: "Experticia",
  certificado: "Certificado",
};
export default function VehicleSpecificationsFields({
  value,
  onChange,
  used,
  documents,
  onDocument,
  existing = {},
}: {
  value: Specifications;
  onChange: (value: Specifications) => void;
  used: boolean;
  documents: Record<string, File>;
  onDocument: (kind: string, file: File) => void;
  existing?: Record<string, string>;
}) {
  const change = (key: keyof Specifications, next: string) =>
    onChange({ ...value, [key]: next });
  return (
    <section className="space-y-4 rounded-xl border border-navy/10 p-4">
      <h3 className="font-semibold text-navy">Características del vehículo</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Tipo de motor
          <input
            value={value.engine_type}
            onChange={(e) => change("engine_type", e.target.value)}
            maxLength={100}
            placeholder="Ej.: 2.0 L turbo, 4 cilindros"
            className="mt-1 w-full rounded-xl border p-3"
          />
        </label>
        <label className="text-sm">
          Cantidad de asientos
          <NumberInput
            value={value.seats}
            onValueChange={(v) => change("seats", v)}
            min="1"
            max="100"
            className="mt-1 w-full rounded-xl border p-3"
          />
        </label>
        <label className="text-sm">
          Material de los asientos
          <input
            list="vehicle-upholstery-options"
            value={value.upholstery}
            onChange={(e) => change("upholstery", e.target.value)}
            maxLength={60}
            placeholder="Selecciona o escribe el material"
            className="mt-1 w-full rounded-xl border p-3"
          />
          <datalist id="vehicle-upholstery-options">
            {[
              "Tela",
              "Cuero",
              "Semicuero",
              "Cuero sintético",
              "Vinilo",
              "Alcántara",
              "Microfibra",
              "Mixto",
            ].map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </label>
        {used && (
          <label className="text-sm">
            Cantidad de dueños anteriores
            <NumberInput
              value={value.previous_owners}
              onValueChange={(v) => change("previous_owners", v)}
              min="0"
              max="100"
              className="mt-1 w-full rounded-xl border p-3"
            />
          </label>
        )}
      </div>
      {used && (
        <div className="space-y-3 border-t pt-4">
          <h4 className="font-medium text-navy">Documentos del usado al día</h4>
          <p className="text-xs text-steel">
            Adjunta los tres documentos en PDF o imagen. Máximo según el límite
            de archivos del sistema.
          </p>
          {Object.entries(documentLabels).map(([kind, label]) => (
            <label className="block text-sm" key={kind}>
              {label}
              {existing[kind] && (
                <span className="ml-2 text-xs text-emerald-700">
                  Registrado
                </span>
              )}
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onDocument(kind, file);
                }}
                className="mt-1 block w-full text-xs"
              />
              {documents[kind] && (
                <span className="text-xs text-steel">
                  {documents[kind].name}
                </span>
              )}
            </label>
          ))}
        </div>
      )}
    </section>
  );
}
