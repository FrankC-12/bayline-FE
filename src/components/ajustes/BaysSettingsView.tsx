"use client";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useBays } from "@/hooks/useBays";
export default function BaysSettingsView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("ajustes");
  const { bays, addBay, renameBay, toggleActive } = useBays(
    currentUser?.filialId ?? null,
  );
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la bahía.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <p className="mt-2 text-sm text-steel">
        Espacios de trabajo que utiliza el calendario. Desactiva una bahía para
        conservar su historial.
      </p>
      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 space-y-3">
        {bays.map((b) => (
          <div
            key={`${b.id}:${b.name}`}
            className="flex flex-wrap items-center gap-3 rounded-2xl border border-navy/10 bg-white p-4"
          >
            <input
              aria-label={`Nombre de ${b.name}`}
              disabled={busy || !canEdit}
              defaultValue={b.name}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== b.name)
                  void run(() => renameBay(b, e.target.value.trim()));
              }}
              className="min-w-0 flex-1 rounded-lg border border-navy/10 p-2 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-steel">
              <input
                type="checkbox"
                checked={b.is_active}
                disabled={busy || !canEdit}
                onChange={() => void run(() => toggleActive(b))}
              />
              Activa
            </label>
          </div>
        ))}
      </div>
      <form
        className="mt-4 flex gap-3 rounded-2xl border border-dashed border-navy/20 p-4"
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await addBay(name.trim());
            setName("");
          });
        }}
      >
        <input
          aria-label="Nombre de la nueva bahía"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la bahía"
          className="min-w-0 flex-1 rounded-xl border border-navy/15 p-3 text-sm"
        />
        <button
          disabled={busy || !canEdit || !name.trim()}
          className="rounded-full bg-blue px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Agregar bahía
        </button>
      </form>
    </div>
  );
}
