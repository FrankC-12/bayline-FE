"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Wrench, TrendingUp, Users, Car } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCount } from "@/lib/format";
import ModuleGrid from "./ModuleGrid";
interface Overview {
  filial_name: string;
  as_of: string;
  workshop: null | {
    counts: Record<string, number>;
    active: number;
    drafts: number;
  };
  commercial: null | {
    counts: Record<string, number>;
    stock: Record<string, number>;
    sold_month: number;
  };
  clients: null | { total: number; new_month: number };
}
const labels: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completado: "Por facturar y entregar",
  prospecto: "Prospecto",
  cotizada: "Cotizada",
  reservada: "Reservada",
  financiamiento: "Financiamiento",
  facturada: "Facturada",
  entregada: "Entregada",
  disponible: "Disponible",
  en_transito: "En tránsito",
  en_preparacion: "En preparación",
  reservado: "Reservado",
  vendido: "Vendido",
};
function Distribution({
  counts,
  stages,
}: {
  counts: Record<string, number>;
  stages: string[];
}) {
  const max = Math.max(1, ...stages.map((s) => counts[s] || 0));
  return (
    <div className="flex min-h-40 items-end gap-3 pt-6">
      {stages.map((key, i) => (
        <div key={key} className="min-w-0 flex-1">
          <div className="flex h-28 items-end">
            <div
              className="w-full rounded-t-md bg-blue transition-all"
              style={{
                height: `${Math.max(3, ((counts[key] || 0) / max) * 100)}%`,
                opacity: 1 - i * 0.1,
              }}
            />
          </div>
          <p className="mt-2 font-semibold">{formatCount(counts[key] || 0)}</p>
          <p className="mt-1 break-words text-[10px] text-steel">
            {labels[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
export default function HomeOverview() {
  const { currentUser } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<Overview>("/dashboard/overview", { toastOnError: false })
      .then((v) => {
        if (active) setData(v);
      })
      .catch(() => {
        if (active)
          setError(
            "No se pudo cargar el resumen. Puedes seguir usando los módulos.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.filialId]);
  return (
    <main>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[.18em] text-blue">
            {new Date().toLocaleDateString("es-VE", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold">
            Hola, {currentUser?.fullName?.split(" ")[0] || "bienvenido"}
          </h1>
          <p className="mt-1 text-sm text-steel">
            Lo más importante hoy y el resumen de cada área.
          </p>
        </div>
        <span className="rounded-lg border border-black/5 bg-white px-4 py-2 text-xs">
          {data?.filial_name || currentUser?.filialName || "Mi sucursal"} · Este
          mes
        </span>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      {loading && !data && (
        <p role="status" className="mb-5 text-sm text-steel">
          Consultando indicadores…
        </p>
      )}
      {data && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ...(data.workshop
                ? [
                    {
                      title: "ODS activas",
                      value: data.workshop.active,
                      detail: "En el taller ahora",
                      icon: Wrench,
                      href: "/dashboard/servicios",
                    },
                  ]
                : []),
              ...(data.commercial
                ? [
                    {
                      title: "Unidades vendidas",
                      value: data.commercial.sold_month,
                      detail: "Ventas registradas este mes",
                      icon: Car,
                      href: "/dashboard/concesionario/ventas",
                    },
                    {
                      title: "Oportunidades activas",
                      value: Object.entries(data.commercial.counts)
                        .filter(([k]) => !["entregada", "perdida"].includes(k))
                        .reduce((sum, [, v]) => sum + v, 0),
                      detail: "Embudo comercial",
                      icon: TrendingUp,
                      href: "/dashboard/concesionario/oportunidades",
                    },
                  ]
                : []),
              ...(data.clients
                ? [
                    {
                      title: "Clientes nuevos",
                      value: data.clients.new_month,
                      detail: `${formatCount(data.clients.total)} registros en total`,
                      icon: Users,
                      href: "/dashboard/clientes",
                    },
                  ]
                : []),
            ].map((card, i) => (
              <Link
                key={card.title}
                href={card.href}
                className={`rounded-2xl border border-black/5 p-5 ${i === 0 ? "bg-[#0c4250] text-white" : "bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-widest opacity-70">
                    {card.title}
                  </p>
                  <card.icon size={16} />
                </div>
                <p className="mt-4 font-display text-3xl font-bold">
                  {formatCount(card.value)}
                </p>
                <p className="mt-2 text-xs opacity-60">{card.detail}</p>
              </Link>
            ))}
          </div>
          <div className="mb-7 grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(280px,1fr)]">
            <div className="space-y-5">
              {data.workshop && (
                <section className="rounded-2xl border border-black/5 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Taller en vivo</h2>
                    <Link
                      href="/dashboard/servicios"
                      className="text-xs text-blue"
                    >
                      Ver tablero ↗
                    </Link>
                  </div>
                  <Distribution
                    counts={data.workshop.counts}
                    stages={["pendiente", "en_progreso", "completado"]}
                  />
                  <p className="mt-5 rounded-lg bg-ash p-3 text-xs text-steel">
                    {formatCount(data.workshop.drafts)} borradores por preparar
                    y enviar al taller.
                  </p>
                </section>
              )}
              {data.commercial && (
                <section className="rounded-2xl border border-black/5 bg-white p-6">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Embudo comercial</h2>
                    <Link
                      href="/dashboard/concesionario/oportunidades"
                      className="text-xs text-blue"
                    >
                      Ver oportunidades ↗
                    </Link>
                  </div>
                  <Distribution
                    counts={data.commercial.counts}
                    stages={[
                      "prospecto",
                      "cotizada",
                      "reservada",
                      "financiamiento",
                      "facturada",
                    ]}
                  />
                </section>
              )}
            </div>
            <section className="rounded-2xl border border-black/5 bg-white p-6">
              <h2 className="mb-5 font-semibold">Siguiente paso</h2>
              {data.workshop && (
                <>
                  <Link
                    className="flex justify-between border-b border-black/5 py-4 text-sm"
                    href="/dashboard/servicios/borradores"
                  >
                    <span>Preparar borradores</span>
                    <strong className="text-blue">
                      {formatCount(data.workshop.drafts)} ↗
                    </strong>
                  </Link>
                  <Link
                    className="flex justify-between border-b border-black/5 py-4 text-sm"
                    href="/dashboard/servicios"
                  >
                    <span>Revisar trabajo completado</span>
                    <strong className="text-blue">
                      {formatCount(data.workshop.counts.completado || 0)} ↗
                    </strong>
                  </Link>
                </>
              )}
              {data.commercial && (
                <>
                  <Link
                    className="flex justify-between border-b border-black/5 py-4 text-sm"
                    href="/dashboard/concesionario/oportunidades"
                  >
                    <span>Prospectos por cotizar</span>
                    <strong className="text-blue">
                      {formatCount(data.commercial.counts.prospecto || 0)} ↗
                    </strong>
                  </Link>
                  <h3 className="mb-3 mt-7 text-xs font-semibold uppercase tracking-widest text-steel">
                    Inventario de vehículos
                  </h3>
                  {Object.entries(data.commercial.stock).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between py-2 text-sm"
                    >
                      <span>{labels[key] || key}</span>
                      <strong>{formatCount(value)}</strong>
                    </div>
                  ))}
                </>
              )}
              <p className="mt-8 text-[11px] text-steel">
                Actualizado{" "}
                {new Date(data.as_of).toLocaleTimeString("es-VE", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Los indicadores respetan tu acceso a cada módulo.
              </p>
            </section>
          </div>
        </>
      )}
      <h2 className="mb-4 font-display text-lg font-bold">Resumen por área</h2>
      <ModuleGrid />
    </main>
  );
}
