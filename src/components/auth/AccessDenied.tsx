import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-full bg-red-50 p-4">
        <ShieldX className="h-8 w-8 text-red-500" />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold text-navy">Acceso denegado</h1>
        <p className="mt-1 max-w-sm text-sm text-steel">
          Tu rol no tiene permiso para ver este módulo. Si crees que deberías tenerlo, pídele a un
          administrador que lo habilite.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
      >
        Volver al panel
      </Link>
    </div>
  );
}
