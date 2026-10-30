"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useVehicles } from "@/hooks/useVehicles";
import { useClients } from "@/hooks/useClients";
import { useUserDirectory } from "@/hooks/useUserDirectory";
import ChangeVehicleStatusModal from "./ChangeVehicleStatusModal";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import VehicleCard from "./VehicleCard";
import AddVehicleModal from "./AddVehicleModal";
import SellVehicleModal from "./SellVehicleModal";
import ReserveVehicleModal from "./ReserveVehicleModal";
import VehicleDetailDrawer from "./VehicleDetailDrawer";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type {
  DealershipVehicle,
  VehicleLocation,
  VehicleStatus,
} from "@/types/concesionario";
import type {
  VehicleReservationInput,
  VehicleSaleInput,
} from "@/lib/api/concesionario";
import { LOCATION_OPTIONS } from "@/lib/vehicle-catalog-dealership";

export default function VehicleCatalogView() {
  const { currentUser } = useAuth();
  const { canEdit } = useModuleAccess("concesionario");
  const { canEdit: canManageCatalog } = useModuleAccess("administracion");
  const filialId = currentUser?.filialId ?? null;

  const [category, setCategory] = useState("todos");
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const externalSearch = searchParams.get("search");
  useEffect(() => {
    if (externalSearch !== null) setSearch(externalSearch);
  }, [externalSearch]);
  const [locationFilter, setLocationFilter] = useState<VehicleLocation | "">(
    "",
  );
  const {
    vehicles,
    loading,
    error,
    addVehicle,
    editVehicle,
    reserveVehicle,
    addVehiclePhotos,
    removeVehiclePhoto,
    refresh,
  } = useVehicles(filialId, search || undefined);
  const { clients } = useClients(filialId);
  const { users } = useUserDirectory({ filialId });
  const [addOpen, setAddOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] =
    useState<DealershipVehicle | null>(null);
  const [sellTarget, setSellTarget] = useState<DealershipVehicle | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    vehicle: DealershipVehicle;
    target: VehicleStatus;
  } | null>(null);
  const [reserveTarget, setReserveTarget] = useState<DealershipVehicle | null>(
    null,
  );
  const visibleVehicles = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.status !== "vendido" &&
          (!locationFilter || vehicle.location === locationFilter),
      ),
    [vehicles, locationFilter],
  );
  const catalogVehicles = visibleVehicles.filter(
    (v) =>
      category === "todos" ||
      (category === "en_transito"
        ? v.status === category
        : v.condition === category),
  );
  function exportCatalog() {
    const cell = (v: unknown) =>
      `"${String(v ?? "")
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const rows = [
      [
        "Marca",
        "Modelo",
        "Año",
        "VIN",
        "Placa",
        "Estado",
        "Contado",
        "Financiado",
      ],
      ...catalogVehicles.map((v) => [
        v.brand,
        v.model,
        v.year,
        v.vin,
        v.plate,
        v.status,
        v.cash_total,
        v.price_financed,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + rows.map((row) => row.map(cell).join(";")).join("\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "catalogo-vehiculos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const summary = useMemo(
    () => ({
      nuevos: visibleVehicles.filter((vehicle) => vehicle.condition === "nuevo")
        .length,
      usados: visibleVehicles.filter((vehicle) => vehicle.condition === "usado")
        .length,
      enTransito: visibleVehicles.filter(
        (vehicle) => vehicle.status === "en_transito",
      ).length,
      disponibles: visibleVehicles.filter(
        (vehicle) => vehicle.status === "disponible",
      ).length,
    }),
    [visibleVehicles],
  );

  async function changeStatus(status: string) {
    if (!selectedVehicle) return;
    if (status === "vendido") {
      setSellTarget(selectedVehicle);
      return;
    }
    if (status === "reservado") {
      setReserveTarget(selectedVehicle);
      return;
    }
    if (status !== selectedVehicle.status)
      setStatusTarget({
        vehicle: selectedVehicle,
        target: status as VehicleStatus,
      });
  }

  async function changeLocation(location: string) {
    if (!selectedVehicle) return;
    const updated = await editVehicle(selectedVehicle.id, { location });
    setSelectedVehicle(updated);
  }

  async function uploadPhotos(vehicleId: string, photos: File[]) {
    const updated = await addVehiclePhotos(vehicleId, photos);
    setSelectedVehicle(updated);
    return updated;
  }

  async function deletePhoto(vehicleId: string, photoUrl: string) {
    const updated = await removeVehiclePhoto(vehicleId, photoUrl);
    setSelectedVehicle(updated);
    return updated;
  }

  async function confirmSale(sale: VehicleSaleInput) {
    if (!sellTarget) return;
    const updated = await editVehicle(sellTarget.id, {
      status: "vendido",
      sale,
    });
    setSelectedVehicle(updated);
  }

  async function confirmReservation(reservation: VehicleReservationInput) {
    if (!reserveTarget) return;
    const updated = await reserveVehicle(reserveTarget.id, reservation);
    setSelectedVehicle(updated);
    setReserveTarget(null);
  }

  if (!filialId) return null;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-navy">
            Catálogo de vehículos
          </h1>
          <p className="mt-1 text-sm text-steel">
            Consulta de inventario del concesionario
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          disabled={!canManageCatalog}
          title={
            canManageCatalog
              ? "Agregar vehículo"
              : "Administración registra las unidades y sus precios"
          }
          className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
        >
          <Plus className="h-4 w-4" />
          Agregar vehículo
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-lg border border-navy/10 bg-white p-1">
          {[
            ["todos", "Todos", visibleVehicles.length],
            ["nuevo", "Nuevos", summary.nuevos],
            ["usado", "Usados", summary.usados],
            ["en_transito", "En tránsito", summary.enTransito],
          ].map(([id, label, count]) => (
            <button
              key={id}
              onClick={() => setCategory(String(id))}
              aria-pressed={category === id}
              className={`rounded-md px-3 py-2 text-xs ${category === id ? "bg-[#191919] text-white" : "text-steel hover:bg-ash"}`}
            >
              {label} <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
        </div>
        <button
          onClick={exportCatalog}
          className="ml-auto rounded-lg border border-navy/10 bg-white px-4 py-2.5 text-xs font-semibold"
        >
          Exportar CSV
        </button>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por marca, modelo, año, placa, VIN o SKU..."
            className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>
        <select
          value={locationFilter}
          onChange={(e) =>
            setLocationFilter(e.target.value as VehicleLocation | "")
          }
          className="rounded-full border border-navy/15 bg-white px-4 py-3 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20"
        >
          <option value="">Todas las ubicaciones</option>
          {LOCATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="whitespace-nowrap text-sm text-steel">
          {catalogVehicles.length} vehículos
        </span>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center text-sm text-steel">
          Cargando catálogo...
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={refresh} compact />
      ) : catalogVehicles.length === 0 ? (
        <EmptyState
          compact
          title={
            search
              ? `Sin resultados para "${search}"`
              : "No hay vehículos en el catálogo."
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {catalogVehicles.map((v) => (
            <VehicleCard
              key={v.id}
              vehicle={v}
              onClick={() => setSelectedVehicle(v)}
              onSell={canEdit ? () => setSellTarget(v) : undefined}
              reservedClientName={
                clients.find((c) => c.id === v.reserved_client_id)?.full_name
              }
              reservedByName={
                users.find((u) => u.id === v.reserved_by_user_id)?.full_name
              }
            />
          ))}
        </div>
      )}

      {statusTarget && (
        <ChangeVehicleStatusModal
          key={`${statusTarget.vehicle.id}:${statusTarget.target}`}
          vehicle={statusTarget.vehicle}
          target={statusTarget.target}
          onClose={() => setStatusTarget(null)}
          onConfirm={async (reason) => {
            const updated = await editVehicle(statusTarget.vehicle.id, {
              status: statusTarget.target,
              status_reason: reason,
            });
            setSelectedVehicle(updated);
          }}
        />
      )}
      <AddVehicleModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          void refresh();
        }}
        filialId={filialId}
        onSubmit={addVehicle}
        onUploadPhotos={addVehiclePhotos}
      />
      <VehicleDetailDrawer
        vehicle={selectedVehicle}
        onClose={() => setSelectedVehicle(null)}
        onStatusChange={changeStatus}
        onLocationChange={changeLocation}
        canEdit={canEdit}
        onDetailsChange={async (input) => {
          if (selectedVehicle) {
            const updated = await editVehicle(selectedVehicle.id, input);
            setSelectedVehicle(updated);
          }
        }}
        onUploadPhotos={uploadPhotos}
        onDeletePhoto={deletePhoto}
        reservedClientName={
          clients.find((c) => c.id === selectedVehicle?.reserved_client_id)
            ?.full_name
        }
        reservedByName={
          users.find((u) => u.id === selectedVehicle?.reserved_by_user_id)
            ?.full_name
        }
      />
      <SellVehicleModal
        open={sellTarget != null}
        onClose={() => setSellTarget(null)}
        filialId={filialId}
        vehicle={sellTarget}
        onConfirm={confirmSale}
      />
      <ReserveVehicleModal
        open={reserveTarget != null}
        onClose={() => setReserveTarget(null)}
        filialId={filialId}
        vehicle={reserveTarget}
        onConfirm={confirmReservation}
      />
    </div>
  );
}
