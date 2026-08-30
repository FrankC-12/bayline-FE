import { ArrowRight, PlayCircle } from "lucide-react";
import InstrumentCluster from "./InstrumentCluster";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-ash">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(18,35,63,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(18,35,63,0.05)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-24 lg:grid-cols-2 lg:items-center lg:py-32">
        <div className="animate-fade-up">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
            ERP para taller y concesionario
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] text-navy sm:text-5xl lg:text-6xl">
            El tablero de control de tu operación automotriz
          </h1>
          <p className="mt-6 max-w-lg text-lg text-steel">
            Bayline conecta taller, concesionario, repuestos y almacén en una
            sola plataforma multi-tenant. Cada rol ve solo lo que necesita
            para operar.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="#modulos"
              className="inline-flex items-center gap-2 rounded-full bg-blue px-6 py-3 font-semibold text-white transition hover:bg-navy"
            >
              Ver módulos
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 rounded-full border border-navy/15 px-6 py-3 font-semibold text-navy transition hover:border-navy/40"
            >
              <PlayCircle className="h-4 w-4" />
              Ver demo
            </a>
          </div>
        </div>
        <div className="animate-fade-up [animation-delay:150ms]">
          <InstrumentCluster />
        </div>
      </div>
    </section>
  );
}