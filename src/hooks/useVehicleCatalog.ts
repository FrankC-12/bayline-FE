"use client";

import { useCallback, useEffect, useState } from "react";
import {
  createVehicleBrand,
  createVehicleModel,
  listVehicleBrands,
  renameVehicleBrand,
  renameVehicleModel,
  setVehicleBrandActive,
  setVehicleModelActive,
} from "@/lib/api/vehicleCatalog";
import type { VehicleBrandOption } from "@/types/vehicleCatalog";

/** The holding-wide brand/model catalog (Ajustes → Marcas y Modelos). Pass
 * includeInactive=true only for the management screen — every brand/model
 * select elsewhere in the app wants active-only, the default. */
export function useVehicleCatalog(filialId: string | null, includeInactive = false) {
  const [brands, setBrands] = useState<VehicleBrandOption[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setBrands([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listVehicleBrands(filialId, includeInactive);
    setBrands(data);
    setLoading(false);
  }, [filialId, includeInactive]);

  useEffect(() => {
    load();
  }, [load]);

  const addBrand = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createVehicleBrand(filialId, name);
      await load();
      return created;
    },
    [filialId, load]
  );

  const editBrand = useCallback(
    async (brandId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameVehicleBrand(filialId, brandId, name);
      await load();
      return updated;
    },
    [filialId, load]
  );

  const toggleBrandActive = useCallback(
    async (brandId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setVehicleBrandActive(filialId, brandId, isActive);
      await load();
    },
    [filialId, load]
  );

  const addModel = useCallback(
    async (brandId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createVehicleModel(filialId, brandId, name);
      await load();
      return created;
    },
    [filialId, load]
  );

  const editModel = useCallback(
    async (modelId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameVehicleModel(filialId, modelId, name);
      await load();
      return updated;
    },
    [filialId, load]
  );

  const toggleModelActive = useCallback(
    async (modelId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setVehicleModelActive(filialId, modelId, isActive);
      await load();
    },
    [filialId, load]
  );

  return {
    brands,
    loading,
    refresh: load,
    addBrand,
    editBrand,
    toggleBrandActive,
    addModel,
    editModel,
    toggleModelActive,
  };
}
