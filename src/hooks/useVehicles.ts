"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from "@/lib/api/concesionario";
import type { DealershipVehicle } from "@/types/concesionario";

export function useVehicles(filialId: string | null, search?: string) {
  const [vehicles, setVehicles] = useState<DealershipVehicle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!filialId) {
      setVehicles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await listVehicles(filialId, search);
    setVehicles(data);
    setLoading(false);
  }, [filialId, search]);

  useEffect(() => {
    load();
  }, [load]);

  const addVehicle = useCallback(async (input: CreateVehicleInput) => {
    const created = await createVehicle(input);
    setVehicles((prev) => [created, ...prev]);
    return created;
  }, []);

  const editVehicle = useCallback(async (id: string, input: UpdateVehicleInput) => {
    const updated = await updateVehicle(id, input);
    setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    return updated;
  }, []);

  const removeVehicle = useCallback(async (id: string) => {
    await deleteVehicle(id);
    setVehicles((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return { vehicles, loading, addVehicle, editVehicle, removeVehicle, refresh: load };
}