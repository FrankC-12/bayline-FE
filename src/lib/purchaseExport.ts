import * as XLSX from "xlsx";

export interface PurchaseExportLine {
  code: string;
  name: string;
  quantity: number;
  unitCost?: number | null;
}

export interface PurchaseExportData {
  requestCode?: string;
  supplierName: string;
  date?: string;
  lines: PurchaseExportLine[];
}

function fileBaseName(data: PurchaseExportData): string {
  const safeSupplier = data.supplierName.replace(/[^a-z0-9]+/gi, "_");
  return `${data.requestCode ?? "solicitud"}_${safeSupplier}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Plain-text purchase order, formatted to email or print for the supplier. */
export function downloadPurchaseRequestTxt(data: PurchaseExportData): void {
  const lines = [
    `Solicitud de compra${data.requestCode ? ` ${data.requestCode}` : ""}`,
    `Proveedor: ${data.supplierName}`,
    ...(data.date ? [`Fecha: ${data.date}`] : []),
    "",
    ...data.lines.map(
      (l, i) =>
        `${i + 1}. ${l.code} - ${l.name} x${l.quantity}` +
        (l.unitCost != null ? ` @ $${l.unitCost.toFixed(2)}` : "")
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, `${fileBaseName(data)}.txt`);
}

/** .xlsx purchase order, one row per line item. */
export function downloadPurchaseRequestExcel(data: PurchaseExportData): void {
  const rows = data.lines.map((l) => ({
    Código: l.code,
    Repuesto: l.name,
    Cantidad: l.quantity,
    ...(l.unitCost != null ? { "Costo unit.": l.unitCost } : {}),
  }));
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Solicitud");
  XLSX.writeFile(workbook, `${fileBaseName(data)}.xlsx`);
}
