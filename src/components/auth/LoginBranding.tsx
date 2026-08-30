import InstrumentCluster from "@/components/landing/InstrumentCluster";

const highlights = [
  "Taller, concesionario, repuestos y almacén en un solo lugar",
  "Roles y permisos por módulo según tu holding",
  "Datos operativos actualizados en tiempo real",
];

export default function LoginBranding() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-navy px-12 py-14 lg:flex">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />

      <div className="relative">
        <span className="font-display text-2xl font-bold text-white">Bayline</span>
        <h1 className="mt-10 max-w-md font-display text-3xl font-bold leading-tight text-white">
          Entrá al tablero de control de tu operación
        </h1>
        <ul className="mt-8 space-y-3">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" />
              {h}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative">
        <InstrumentCluster />
      </div>
    </div>
  );
}