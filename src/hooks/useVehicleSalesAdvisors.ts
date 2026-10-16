"use client";
import { apiFetch } from "@/lib/api/client";
import { useListLoader } from "./useListLoader";
import type { UserDirectoryEntry } from "@/types/user";
/** Only active vehicle-sales advisors in the current filial, with sale access. */
export function useVehicleSalesAdvisors(filialId:string|null) {
 const list=useListLoader<UserDirectoryEntry>(()=>filialId ? apiFetch(`/vehicle-sales/advisors?filial_id=${encodeURIComponent(filialId)}`) : Promise.resolve([]),[filialId]);
 return {users:list.data,loading:list.loading,error:list.error,refresh:list.refresh};
}
