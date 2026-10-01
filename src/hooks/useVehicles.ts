"use client";

import { useCallback } from "react";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  reserveVehicle,
  deleteVehicle,
  uploadVehiclePhotos,
  type CreateVehicleInput,
  type UpdateVehicleInput,
  type VehicleReservationInput,
} from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";
import { useListLoader } from "./useListLoader";

export function useVehicles(filialId: string | null, search?: string) {
  const {
    data: vehicles,
    setData: setVehicles,
    loading,
    error,
    refresh,
  } = useListLoader<DealershipVehicle>(
    () => (filialId ? listVehicles(filialId, search) : Promise.resolve([])),
    [filialId, search]
  );

  const addVehicle = useCallback(
    async (input: CreateVehicleInput) => {
      const created = await createVehicle(input);
      setVehicles((prev) => [created, ...prev]);
      return created;
    },
    [setVehicles]
  );

  const editVehicle = useCallback(
    async (id: string, input: UpdateVehicleInput) => {
      const updated = await updateVehicle(id, input);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      return updated;
    },
    [setVehicles]
  );

  const reserveVehicleAction = useCallback(
    async (id: string, input: VehicleReservationInput) => {
      const updated = await reserveVehicle(id, input);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      return updated;
    },
    [setVehicles]
  );

  const removeVehicle = useCallback(
    async (id: string) => {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    },
    [setVehicles]
  );

  const addVehiclePhotos = useCallback(
    async (id: string, photos: File[]) => {
      const updated = await uploadVehiclePhotos(id, photos);
      setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      return updated;
    },
    [setVehicles]
  );

  return {
    vehicles,
    loading,
    error,
    addVehicle,
    editVehicle,
    reserveVehicle: reserveVehicleAction,
    removeVehicle,
    addVehiclePhotos,
    refresh,
  };
}
