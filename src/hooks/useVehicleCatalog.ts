"use client";

import { useCallback } from "react";
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
import { useListLoader } from "./useListLoader";

/** The holding-wide brand/model catalog (Ajustes → Marcas y Modelos). Pass
 * includeInactive=true only for the management screen — every brand/model
 * select elsewhere in the app wants active-only, the default. */
export function useVehicleCatalog(filialId: string | null, includeInactive = false) {
  const {
    data: brands,
    loading,
    error,
    refresh,
  } = useListLoader<VehicleBrandOption>(
    () => (filialId ? listVehicleBrands(filialId, includeInactive) : Promise.resolve([])),
    [filialId, includeInactive]
  );

  const addBrand = useCallback(
    async (name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createVehicleBrand(filialId, name);
      await refresh();
      return created;
    },
    [filialId, refresh]
  );

  const editBrand = useCallback(
    async (brandId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameVehicleBrand(filialId, brandId, name);
      await refresh();
      return updated;
    },
    [filialId, refresh]
  );

  const toggleBrandActive = useCallback(
    async (brandId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setVehicleBrandActive(filialId, brandId, isActive);
      await refresh();
    },
    [filialId, refresh]
  );

  const addModel = useCallback(
    async (brandId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const created = await createVehicleModel(filialId, brandId, name);
      await refresh();
      return created;
    },
    [filialId, refresh]
  );

  const editModel = useCallback(
    async (modelId: string, name: string) => {
      if (!filialId) throw new Error("Filial requerida.");
      const updated = await renameVehicleModel(filialId, modelId, name);
      await refresh();
      return updated;
    },
    [filialId, refresh]
  );

  const toggleModelActive = useCallback(
    async (modelId: string, isActive: boolean) => {
      if (!filialId) throw new Error("Filial requerida.");
      await setVehicleModelActive(filialId, modelId, isActive);
      await refresh();
    },
    [filialId, refresh]
  );

  return {
    brands,
    loading,
    error,
    refresh,
    addBrand,
    editBrand,
    toggleBrandActive,
    addModel,
    editModel,
    toggleModelActive,
  };
}
