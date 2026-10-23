"use client";
import OrderTypeRulesView from "./OrderTypeRulesView";
import BaysSettingsView from "./BaysSettingsView";
import BulkCatalogView from "./BulkCatalogView";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { SETTINGS_GROUPS, SETTINGS_ITEMS } from "./sections";
import SettingsSectionView from "./SettingsSectionView";
import MarcasModelosView from "./MarcasModelosView";
import PartCategoriesView from "./PartCategoriesView";
import PartMeasuresView from "./PartMeasuresView";
import StockInReasonsView from "./StockInReasonsView";
import StockOutReasonsView from "./StockOutReasonsView";
import TemparioListView from "@/components/post-ventas/TemparioListView";

export default function AjustesView({
  section = "impuestos",
}: {
  section?: string;
}) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  function navigate(href: string) {
    if (dirty) setNext(href);
    else router.push(href);
  }
  const title =
    section === "impuestos"
      ? "Impuestos y tasa de cambio"
      : (SETTINGS_ITEMS.find((item) => item.id === section)?.label ??
        "Ajustes");
  return (
    <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-screen-2xl gap-8 px-5 py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
      <aside className="min-w-0">
        <Link
          href="/dashboard"
          onClick={(event) => {
            event.preventDefault();
            navigate("/dashboard");
          }}
          className="mb-6 inline-flex items-center gap-1 text-sm text-steel"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver al Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold text-navy">Ajustes</h1>
        <p className="mb-6 mt-2 text-sm text-steel">
          Reglas, catálogos y valores por defecto que usa todo el negocio.
        </p>
        <nav
          aria-label="Secciones de Ajustes"
          className="flex gap-4 overflow-x-auto lg:block lg:space-y-6"
        >
          {SETTINGS_GROUPS.map((group) => (
            <div key={group.label} className="min-w-[180px]">
              <p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-widest text-blue">
                {group.label}
              </p>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/dashboard/ajustes/${item.id}`}
                  aria-current={section === item.id ? "page" : undefined}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(`/dashboard/ajustes/${item.id}`);
                  }}
                  className={`mb-1 block rounded-xl px-3 py-2.5 text-sm ${section === item.id ? "bg-blue-light font-semibold text-blue" : "text-steel hover:bg-white"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">
        {section !== "temparios" && (
          <h2 className="mb-5 font-display text-3xl font-bold text-navy">
            {title}
          </h2>
        )}
        {[
          "impuestos",
          "retenciones",
          "movimientos-manuales",
          "mano-de-obra",
          "garantias",
        ].includes(section) && (
          <SettingsSectionView
            key={section}
            section={section}
            onDirtyChange={setDirty}
          />
        )}
        {section === "tipos-ods" && <OrderTypeRulesView />}
        {section === "bahias" && <BaysSettingsView />}
        {section === "cargas-masivas" && <BulkCatalogView />}
        {section === "temparios" && <TemparioListView />}
        {section === "marcas-modelos" && <MarcasModelosView />}
        {section === "categorias-repuestos" && <PartCategoriesView />}
        {section === "medidas-repuestos" && <PartMeasuresView />}
        {section === "entradas-repuestos" && <StockInReasonsView />}
        {section === "salidas-repuestos" && <StockOutReasonsView />}
      </main>
      <ConfirmDialog
        open={!!next}
        title="Tienes cambios sin guardar"
        description="Guarda los cambios de esta sección o confirma que deseas descartarlos."
        confirmLabel="Descartar y salir"
        onCancel={() => setNext(null)}
        onConfirm={() => {
          if (next) {
            setDirty(false);
            router.push(next);
            setNext(null);
          }
        }}
      />
    </div>
  );
}
