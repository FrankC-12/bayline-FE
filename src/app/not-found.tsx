import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ash px-6 text-center">
      <span className="font-display text-6xl font-bold text-navy/15">404</span>
      <Compass className="-mt-2 h-10 w-10 text-blue" />
      <h1 className="mt-4 font-display text-2xl font-bold text-navy">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-steel">
        La página que buscas no existe, fue movida o el enlace está mal escrito.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
