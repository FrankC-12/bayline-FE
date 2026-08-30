import Link from "next/link";
import { Wrench, Car, Boxes, ArrowRight } from "lucide-react";

const categories = [
  {
    icon: Wrench,
    title: "Taller",
    description:
      "Asesores, técnicos y KPIs operativos: inspecciones, órdenes de servicio y tiempos por etapa.",
    tint: "bg-blue-light text-blue",
  },
  {
    icon: Car,
    title: "Concesionario",
    description: "Catálogo de vehículos, inventario y ventas del concesionario en un mismo lugar.",
    tint: "bg-amber/15 text-amber",
  },
  {
    icon: Boxes,
    title: "Almacén y repuestos",
    description: "Inventario por almacén, movimientos FIFO y venta de repuestos al público.",
    tint: "bg-emerald-100 text-emerald-700",
  },
];

export default function ModulesPreview() {
  return (
    <section id="modulos" className="mx-auto max-w-7xl px-6 py-24">
      <div className="max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
          Un módulo por cada área
        </span>
        <h2 className="mt-4 font-display text-3xl font-bold text-navy sm:text-4xl">
          Todo tu negocio, organizado por rol
        </h2>
        <p className="mt-4 text-steel">
          Al entrar a la plataforma vas a ver el panel completo de módulos:
          taller, administración, ventas, clientes y más — cada uno con
          acceso según tu rol.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {categories.map(({ icon: Icon, title, description, tint }) => (
          <div
            key={title}
            className="rounded-2xl border border-navy/10 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg font-bold text-navy">{title}</h3>
            <p className="mt-2 text-sm text-steel">{description}</p>
          </div>
        ))}
      </div>
      <Link
        href="/login"
        className="mt-12 inline-flex items-center gap-2 font-semibold text-blue hover:text-navy"
      >
        Entrar a la plataforma
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}