import { ShieldCheck, Layers, Gauge } from "lucide-react";

const features = [
  {
    icon: Layers,
    title: "Multi-tenant real",
    description: "Cada holding y filial opera de forma aislada, con sus propios usuarios, roles y datos.",
  },
  {
    icon: ShieldCheck,
    title: "Roles y permisos por módulo",
    description:
      "El súper administrador define quién ve cada módulo: taller, concesionario, almacén o administración.",
  },
  {
    icon: Gauge,
    title: "Datos operativos en tiempo real",
    description:
      "KPIs de técnicos, asesores y almacenistas actualizados a medida que avanza el trabajo del taller.",
  },
];

export default function WhyBayline() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">Por qué Bayline</span>
        <div className="mt-4 grid gap-10 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title}>
              <Icon className="h-6 w-6 text-navy" />
              <h3 className="mt-4 font-display text-lg font-bold text-navy">{title}</h3>
              <p className="mt-2 text-sm text-steel">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}