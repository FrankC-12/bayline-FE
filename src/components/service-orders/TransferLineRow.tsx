"use client";
import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatMoney, formatCount } from "@/lib/format";
import { NumberInput } from "@/components/ui/NumberInput";
import type { TransferLine } from "@/types/serviceOrder";
import type { Part } from "@/types/parts";
export default function TransferLineRow({
  line,
  part,
  canEdit,
  onChangeQuantity,
  onRemoveLine,
}: {
  line: TransferLine;
  part: Part | undefined;
  canEdit: boolean;
  onChangeQuantity: (lineId: string, quantity: number) => Promise<void>;
  onRemoveLine: (lineId: string) => Promise<void>;
}) {
  const [quantity, setQuantity] = useState(String(line.quantity));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setQuantity(String(line.quantity));
  }, [line.quantity]);

  async function commit() {
    const next = Math.trunc(Number(quantity));
    if (!Number.isFinite(next) || next < 1 || next === line.quantity) {
      setQuantity(String(line.quantity));
      return;
    }
    setBusy(true);
    try {
      await onChangeQuantity(line.id, next);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await onRemoveLine(line.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr>
      <td className="break-words py-2 pr-3 text-navy">
        {line.part_name ?? part?.name ?? "Repuesto"}
        <span className="mt-1 block font-mono text-xs text-blue">
          {line.part_code ?? part?.code}
        </span>
      </td>
      <td className="py-1.5 text-navy">
        {canEdit ? (
          <NumberInput
            aria-label={`Cantidad de ${line.part_name ?? part?.name ?? "repuesto"}`}
            min={1}
            value={quantity}
            disabled={busy}
            onValueChange={(value) => setQuantity(value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-16 rounded-lg border border-navy/15 px-2 py-1 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:opacity-60"
          />
        ) : (
          formatCount(line.quantity)
        )}
      </td>
      <td className="whitespace-nowrap py-2 pl-3 text-right text-navy">
        {line.unit_price == null ? "—" : `$${formatMoney(line.unit_price, 2)}`}
      </td>
      <td className="whitespace-nowrap py-2 pl-3 text-right font-medium text-navy">
        {line.subtotal == null ? "—" : `$${formatMoney(line.subtotal, 2)}`}
      </td>
      {canEdit && (
        <td className="py-1.5 pl-2 text-right">
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label={`Quitar ${line.part_name ?? part?.name ?? "repuesto"}`}
            className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      )}
    </tr>
  );
}
