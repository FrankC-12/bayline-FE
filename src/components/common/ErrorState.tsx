import { AlertTriangle, Lock, RotateCw, ServerCrash, WifiOff } from "lucide-react";
import type { ListErrorInfo } from "@/lib/api/listError";

interface ErrorStateProps {
  error: ListErrorInfo;
  onRetry: () => void;
  retrying?: boolean;
  /** Single-line style used inside tables/lists, instead of the bordered card. */
  compact?: boolean;
}

const ICONS = {
  forbidden: Lock,
  server: ServerCrash,
  timeout: WifiOff,
  unknown: AlertTriangle,
};

const TITLES: Record<ListErrorInfo["kind"], string> = {
  forbidden: "Sin permisos",
  server: "Error del servidor",
  timeout: "Sin conexión",
  unknown: "No se pudo cargar",
};

/** Shared "list failed to load" state — always paired with a retry action,
 * so a list never has to fall back to silently staying on "Cargando..." or
 * rendering nothing when its fetch fails. Mirrors EmptyState's API/shape,
 * used the same way (a component swaps in whichever of the two applies). */
export default function ErrorState({ error, onRetry, retrying, compact }: ErrorStateProps) {
  const Icon = ICONS[error.kind];

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2 p-12 text-center text-sm text-steel">
        <Icon className="h-5 w-5 text-red-500" />
        <p className="text-navy">{error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-navy/15 px-4 py-1.5 text-xs font-semibold text-navy transition hover:border-blue hover:text-blue disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${retrying ? "animate-spin" : ""}`} />
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50/40 p-12 text-center">
      <Icon className="mx-auto h-8 w-8 text-red-500" />
      <p className="mt-3 font-display text-lg font-bold text-navy">{TITLES[error.kind]}</p>
      <p className="mt-1 text-sm text-steel">{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue disabled:opacity-50"
      >
        <RotateCw className={`h-4 w-4 ${retrying ? "animate-spin" : ""}`} />
        Reintentar
      </button>
    </div>
  );
}
