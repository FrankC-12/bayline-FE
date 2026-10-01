"use client";

import { useMemo } from "react";
import { scheduledOrdersForDate } from "@/lib/calendar";
import { useServiceOrders } from "./useServiceOrders";

/** Use the same active-order source as the board. Filter by workshop day locally:
 * the API date filter uses the database timezone, which may differ from Caracas. */
export function useScheduledOrders(filialId: string | null, dateStr: string) {
  const { orders: activeOrders, editOrder, ...state } = useServiceOrders(filialId, "active");
  const orders = useMemo(() => scheduledOrdersForDate(activeOrders, dateStr), [activeOrders, dateStr]);
  return { ...state, orders, activeOrders, rescheduleOrder: editOrder };
}
