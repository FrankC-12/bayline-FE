/** Validación sintáctica; no confirma que el INTT haya emitido la placa. */
export type VenezuelaPlateType =
  | "particular" | "motocicleta" | "carga" | "grua" | "discapacidad"
  | "transporte_escolar" | "transporte_privado" | "transporte_turistico"
  | "transporte_publico" | "taxi" | "temporal" | "puerto_libre"
  | "poder_publico" | "fuerza_armada" | "transito" | "emergencia"
  | "diplomatica" | "traccion_sangre" | "historica";

export interface VenezuelaPlateValidation {
  valid: boolean;
  normalized: string;
  type: VenezuelaPlateType | null;
}

// Q y Z no son códigos de entidad federal válidos en la posición final.
const STATE = "[A-PR-Y]";
const L = "[A-Z]";
const patterns: ReadonlyArray<readonly [VenezuelaPlateType, RegExp]> = [
  ["particular", new RegExp(`^${L}{2}\\d{3}${L}${STATE}$`)],
  ["motocicleta", new RegExp(`^${L}{2}\\d${L}\\d{2}${STATE}$`)],
  ["carga", new RegExp(`^${L}\\d{2}${L}{2}\\d${STATE}$`)],
  ["grua", new RegExp(`^${L}\\d{2}${L}\\d{2}${STATE}$`)],
  ["discapacidad", new RegExp(`^${L}\\d{2}${L}\\d${STATE}$`)],
  ["transporte_escolar", new RegExp(`^${L}\\d{3}${L}\\d${STATE}$`)],
  ["transporte_privado", new RegExp(`^${L}\\d{4}${L}${STATE}$`)],
  ["transporte_turistico", new RegExp(`^(?:${L}\\d${L}{2}\\d{2}${STATE}|${L}\\d{2}${L}\\d${L}{2}|${L}\\d${L}\\d${L}\\d${L})$`)],
  ["transporte_publico", new RegExp(`^01${L}{2}\\d${L}${STATE}$`)],
  ["transporte_publico", new RegExp(`^(?:\\d{2}${L}\\d{2}${L}|\\d{2}${L}{2}\\d|\\d{3}${L}\\d)${STATE}$`)],
  ["taxi", new RegExp(`^7${L}\\d${L}\\d${L}${STATE}$`)],
  ["transporte_publico", new RegExp(`^[89]${L}\\d(?:${L}\\d{2}|\\d{2}${L})${STATE}$`)],
  ["temporal", new RegExp(`^\\d{6}${STATE}$`)],
  ["puerto_libre", new RegExp(`^(?:${L}{2}\\d{4}|${L}{2}\\d{2}${L}\\d|${L}\\d${L}\\d{3}|\\d${L}{2}\\d{3})O$`)],
  ["traccion_sangre", new RegExp(`^${L}\\d${L}{2}\\d${STATE}$`)],
  ["poder_publico", /^(?:0[1-4]|P[LEJC]0[1-3]|\d{1,3}[A-PR-Y])$/],
  ["fuerza_armada", /^\d{7}$/],
  ["transito", /^TT\d{5}$/],
  ["emergencia", /^\d\d{2,5}[A-PR-Y]$/],
  // El serial diplomático es asignado por Cancillería; se validan sus sufijos.
  ["diplomatica", /^(?:[A-Z0-9]{1,6})?(?:CD|CC|MI)$/],
  // Sistemas 1995-2008 y 1982-1997, respectivamente.
  ["historica", /^[A-PR-Y][A-Z]{2}\d{2}[A-Z]$/],
  ["historica", /^[A-Z]{3}\d{3}$/],
];

export function normalizeVenezuelaPlate(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.-]/g, "");
}

export function validateVenezuelaPlate(value: string): VenezuelaPlateValidation {
  const normalized = normalizeVenezuelaPlate(value);
  if (!normalized || !/^[A-Z0-9]+$/.test(normalized)) {
    return { valid: false, normalized, type: null };
  }
  const match = patterns.find(([, pattern]) => pattern.test(normalized));
  return { valid: Boolean(match), normalized, type: match?.[0] ?? null };
}

export function isValidVenezuelaPlate(value: string): boolean {
  return validateVenezuelaPlate(value).valid;
}
