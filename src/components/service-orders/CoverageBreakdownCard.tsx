"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useParts } from "@/hooks/useParts";
import { PAYER_LABELS, PAYER_OPTIONS } from "@/lib/servicePayers";
import type { OrderSummary, ServiceOrderPayer } from "@/types/serviceOrder";

interface Props {
  summary: OrderSummary;
  filialId: string;
  readOnly: boolean;
  onChangeTaskPayer: (id: string, payer: ServiceOrderPayer) => Promise<void>;
  onChangeLinePayer: (id: string, payer: ServiceOrderPayer) => Promise<void>;
}

const money = (value: number) => `$${value.toFixed(2)}`;

export default function CoverageBreakdownCard({ summary, filialId, readOnly, onChangeTaskPayer, onChangeLinePayer }: Props) {
  const { parts } = useParts(filialId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rows = [
    ...summary.tasks.map((task) => ({ id: task.id, name: task.name_snapshot, detail: `${task.code_snapshot} · Mano de obra · ${task.hours_snapshot} h`, payer: task.payer, task: true })),
    ...summary.transfers.flatMap((transfer) => transfer.lines.map((line) => {
      const part = parts.find((item) => item.id === line.part_id);
      return { id: line.id, name: part?.name ?? "Repuesto", detail: `${transfer.code} · ${part?.code ?? ""} · Cant. ${line.quantity}`, payer: line.payer, task: false };
    })),
  ];

  async function change(row: typeof rows[number], payer: ServiceOrderPayer) {
    if (readOnly || saving) return;
    setSaving(true);
    setError(null);
    try {
      await (row.task ? onChangeTaskPayer : onChangeLinePayer)(row.id, payer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la cobertura.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-navy/10 bg-white" aria-label="Cobertura y responsables de pago" aria-busy={saving}>
      <div className="border-b border-navy/10 p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><ShieldCheck className="h-5 w-5 text-blue" />Cobertura y responsables de pago</h3>
        <p className="mt-1 text-sm text-steel">Asigna quién cubre cada tarea y repuesto: cliente, garantía del taller, fábrica, plan de mantenimiento o proveedor.</p>
      </div>
      {error && <p role="alert" className="mx-6 mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {rows.length === 0 ? <p className="p-6 text-sm text-steel">Agrega tareas o repuestos para distribuir su cobertura.</p> : (
        <div className="divide-y divide-navy/5">
          {rows.map((row) => (
            <div key={`${row.task}-${row.id}`} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-sm font-semibold text-navy">{row.name}</p><p className="mt-1 font-mono text-xs text-steel">{row.detail}</p></div>
              <select aria-label={`Responsable de pago de ${row.name}`} value={row.payer} disabled={readOnly || saving} onChange={(e) => void change(row, e.target.value as ServiceOrderPayer)} className="rounded-xl border border-navy/15 bg-white px-3 py-2 text-sm text-navy disabled:opacity-60 sm:w-56">
                {PAYER_OPTIONS.map((payer) => <option key={payer} value={payer}>{PAYER_LABELS[payer]}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-navy/10 p-6">
        <p className="mb-3 font-mono text-xs uppercase tracking-widest text-steel">Desglose por responsable · antes de impuestos</p>
        {summary.payer_breakdown ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {summary.payer_breakdown.map((item) => <div key={item.payer} className={`rounded-xl border p-4 ${item.payer === "cliente" ? "border-blue/20 bg-blue-light/30" : "border-navy/10 bg-ash/50"}`}>
            <p className="text-sm font-semibold text-navy">{PAYER_LABELS[item.payer]}</p>
            <p className="mt-3 flex justify-between gap-2 text-xs text-steel"><span>Mano de obra</span><span>{money(item.labor_subtotal)}</span></p>
            <p className="mt-2 flex justify-between gap-2 text-xs text-steel"><span>Repuestos</span><span>{money(item.parts_subtotal)}</span></p>
            <p className="mt-3 border-t border-navy/10 pt-3 font-mono text-lg font-bold text-blue">{money(item.subtotal)}</p>
          </div>)}
        </div> : <p className="text-sm text-steel">El desglose por responsable no está disponible para esta orden.</p>}
      </div>
    </section>
  );
}
