"use client";

import { useMemo } from "react";
import { useClients } from "./useClients";
import type { Client, Vehicle } from "@/types/client";

export interface VehicleLookupEntry {
  vehicle: Vehicle;
  client: Client;
}

export function useVehicleLookup(filialId: string | null) {
  const { clients, loading } = useClients(filialId);

  const vehicleMap = useMemo(() => {
    const m = new Map<string, VehicleLookupEntry>();
    for (const client of clients) {
      for (const vehicle of client.vehicles) {
        m.set(vehicle.id, { vehicle, client });
      }
    }
    return m;
  }, [clients]);

  return { clients, vehicleMap, loading };
}