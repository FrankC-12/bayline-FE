"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWarehouses } from "@/hooks/useWarehouses";
import type { Warehouse } from "@/types/warehouse";

interface WarehouseContextValue {
  filialId: string | null;
  warehouses: Warehouse[];
  activeWarehouse: Warehouse | null;
  activeWarehouseId: string | null;
  loading: boolean;
  selectWarehouse: (id: string) => void;
  createWarehouse: (name: string) => Promise<Warehouse | undefined>;
}

const WarehouseContext = createContext<WarehouseContextValue | undefined>(undefined);

export function WarehouseProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { warehouses: allWarehouses, loading, addWarehouse } = useWarehouses(filialId);
  const warehouses = useMemo(
    () => allWarehouses.filter((warehouse) => warehouse.is_active),
    [allWarehouses]
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!filialId || warehouses.length === 0) {
      setSelectedId(null);
      return;
    }
    const saved = localStorage.getItem(`bayline_active_warehouse_${filialId}`);
    setSelectedId((current) => {
      if (current && warehouses.some((warehouse) => warehouse.id === current)) return current;
      if (saved && warehouses.some((warehouse) => warehouse.id === saved)) return saved;
      return warehouses[0].id;
    });
  }, [filialId, warehouses]);

  function selectWarehouse(id: string) {
    setSelectedId(id);
    if (filialId) localStorage.setItem(`bayline_active_warehouse_${filialId}`, id);
  }

  async function createWarehouse(name: string) {
    const created = await addWarehouse(name);
    if (created) selectWarehouse(created.id);
    return created;
  }

  const activeWarehouse = warehouses.find((warehouse) => warehouse.id === selectedId) ?? null;

  return (
    <WarehouseContext.Provider
      value={{
        filialId,
        warehouses,
        activeWarehouse,
        activeWarehouseId: activeWarehouse?.id ?? null,
        loading,
        selectWarehouse,
        createWarehouse,
      }}
    >
      {children}
    </WarehouseContext.Provider>
  );
}

export function useWarehouseScope(): WarehouseContextValue {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error("useWarehouseScope must be used within WarehouseProvider");
  return context;
}
