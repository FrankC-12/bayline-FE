"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles } from "@/hooks/useVehicles";
import VehicleCard from "./VehicleCard";
import AddVehicleModal from "./AddVehicleModal";
import SellVehicleModal from "./SellVehicleModal";
import VehicleDetailDrawer from "./VehicleDetailDrawer";
import type { DealershipVehicle } from "@/types/concesionario";
import type { VehicleSaleInput } from "@/lib/api/concesionario";

export default function VehicleCatalogView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;

  const [search, setSearch] = useState("");
  const { vehicles, loading, addVehicle, editVehicle } = useVehicles(filialId, search || undefined);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<DealershipVehicle | null>(null);
  const [sellTarget, setSellTarget] = useState<DealershipVehicle | null>(null);
  const visibleVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.status !== "vendido"), [vehicles]);
  const summary = useMemo(() => ({
    nuevos: visibleVehicles.filter((vehicle) => vehicle.condition === "nuevo").length,
    usados: visibleVehicles.filter((vehicle) => vehicle.condition === "usado").length,
    enTransito: visibleVehicles.filter((vehicle) => vehicle.status === "en_transito").length,
    disponibles: visibleVehicles.filter((vehicle) => vehicle.status === "disponible").length,
  }), [visibleVehicles]);

  async function changeStatus(status: string) {
    if (!selectedVehicle) return;
    if (status === "vendido") {
      setSellTarget(selectedVehicle);
      return;
    }
    const updated = await editVehicle(selectedVehicle.id, { status });
    setSelectedVehicle(updated);
  }

  async function confirmSale(sale: VehicleSaleInput) {
    if (!sellTarget) return;
    const updated = await editVehicle(sellTarget.id, { status: "vendido", sale });
    setSelectedVehicle(updated);
    setSellTarget(null);
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">Catálogo de Vehículos</h1>
          <p className="mt-1 text-sm text-steel">Consulta de inventario del concesionario</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Agregar vehículo
        </button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[{ label: "Nuevos", value: summary.nuevos }, { label: "Usados", value: summary.usados }, { label: "En tránsito", value: summary.enTransito }, { label: "Disponibles", value: summary.disponibles }].map((item) => <div key={item.label} className="rounded-2xl border border-navy/10 bg-white p-5"><p className="font-mono text-[11px] uppercase tracking-widest text-steel">{item.label}</p><p className="mt-1 font-display text-3xl font-bold text-navy">{item.value}</p></div>)}
      </div>

      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por marca, modelo, año, placa, VIN o SKU..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <span className="whitespace-nowrap text-sm text-steel">{visibleVehicles.length} vehículos</span>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando catálogo...
        </div>
      ) : visibleVehicles.length === 0 ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          No hay vehículos en el catálogo.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleVehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onClick={() => setSelectedVehicle(v)} />
          ))}
        </div>
      )}

      <AddVehicleModal open={addOpen} onClose={() => setAddOpen(false)} filialId={filialId} onSubmit={addVehicle} />
      <VehicleDetailDrawer vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} onStatusChange={changeStatus} />
      <SellVehicleModal open={sellTarget != null} onClose={() => setSellTarget(null)} filialId={filialId} vehicle={sellTarget} onConfirm={confirmSale} />
    </div>
  );
}
