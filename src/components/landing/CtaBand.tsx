import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function CtaBand() {
  return (
    <section className="bg-navy py-20">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
          Poné en marcha tu operación con Bayline
        </h2>
        <p className="mt-4 text-slate-300">
          Iniciá sesión y accedé al panel completo de módulos de tu holding.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-amber px-7 py-3 font-semibold text-navy transition hover:bg-white"
        >
          Iniciar sesión
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}