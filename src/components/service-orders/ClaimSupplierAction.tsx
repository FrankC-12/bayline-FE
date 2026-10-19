"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import type { WarrantyClaim } from "@/types/warrantyClaim";
export default function ClaimSupplierAction({
  claim,
  onUpdated,
}: {
  claim: WarrantyClaim;
  onUpdated: (c: WarrantyClaim) => void;
}) {
  const [parts, setParts] = useState<
      { id: string; name: string; code: string }[]
    >([]),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    apiFetch<{ id: string; name: string; code: string }[]>(
      `/warranty-claims/${claim.id}/installed-parts`,
    )
      .then((rows) => {
        if (live) setParts(rows);
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [claim.id]);
  async function submit() {
    setBusy(true);
    setError("");
    try {
      onUpdated(
        await apiFetch<WarrantyClaim>(
          `/warranty-claims/${claim.id}/supplier-claim?part_id=${selected}`,
          { method: "POST" },
        ),
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo reclamar el repuesto.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-xl border border-navy/10 p-4">
      <h3 className="font-semibold text-navy">¿La pieza vino defectuosa?</h3>
      <p className="text-xs text-steel">
        Reclamar al proveedor usando los lotes que se despacharon en la ODS
        original.
      </p>
      {claim.auto_generated_supplier_claim_ids.length > 0 && (
        <p className="text-xs text-emerald-700">
          Reclamo al proveedor registrado.
        </p>
      )}
      <select
        aria-label="Repuesto instalado para reclamar"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="w-full rounded-xl border border-navy/15 p-3 text-sm"
      >
        <option value="">Seleccionar repuesto instalado</option>
        {parts.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} · {p.name}
          </option>
        ))}
      </select>
      {!parts.length && (
        <p className="text-xs text-steel">
          No hay repuestos despachados en la ODS de origen.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
      <button
        disabled={!selected || busy}
        onClick={() => void submit()}
        className="rounded-full border border-blue px-4 py-2 text-sm font-semibold text-blue disabled:opacity-40"
      >
        {busy ? "Registrando…" : "Reclamar al proveedor"}
      </button>
    </section>
  );
}
