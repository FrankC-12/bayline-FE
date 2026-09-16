"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import ParametrosView from "./ParametrosView";
import MarcasModelosView from "./MarcasModelosView";
import PartCategoriesView from "./PartCategoriesView";
import PartMeasuresView from "./PartMeasuresView";
import StockInReasonsView from "./StockInReasonsView";

type Tab =
  | "parametros"
  | "marcas-modelos"
  | "categorias-repuestos"
  | "medidas-repuestos"
  | "motivos-entrada";

export default function AjustesView() {
  const [tab, setTab] = useState<Tab>("parametros");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Dashboard
      </Link>
      <h1 className="font-display text-3xl font-bold text-navy">Ajustes</h1>
      <p className="mt-1 text-sm text-steel">
        Parámetros financieros y operativos, y el catálogo de vehículos que usa todo el negocio.
      </p>

      <div className="mt-6 flex border-b border-navy/10">
        <button
          onClick={() => setTab("parametros")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "parametros" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
          }`}
        >
          Parámetros
        </button>
        <button
          onClick={() => setTab("marcas-modelos")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "marcas-modelos" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
          }`}
        >
          Marcas y Modelos
        </button>
        <button
          onClick={() => setTab("categorias-repuestos")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "categorias-repuestos" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
          }`}
        >
          Categorías de Repuestos
        </button>
        <button
          onClick={() => setTab("medidas-repuestos")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "medidas-repuestos" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
          }`}
        >
          Medidas de Repuestos
        </button>
        <button
          onClick={() => setTab("motivos-entrada")}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            tab === "motivos-entrada" ? "border-blue text-blue" : "border-transparent text-steel hover:text-navy"
          }`}
        >
          Motivos de Entrada
        </button>
      </div>

      <div className="mt-6">
        {tab === "parametros" && <ParametrosView />}
        {tab === "marcas-modelos" && <MarcasModelosView />}
        {tab === "categorias-repuestos" && <PartCategoriesView />}
        {tab === "medidas-repuestos" && <PartMeasuresView />}
        {tab === "motivos-entrada" && <StockInReasonsView />}
      </div>
    </div>
  );
}
