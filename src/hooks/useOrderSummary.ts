"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOrderSummary,
  addTask,
  updateTaskStatus,
  deleteTask,
  addTransferLine,
  markTransferOrdered,
} from "@/lib/api/serviceOrders";
import type { OrderSummary } from "@/types/serviceOrder";

export function useOrderSummary(orderId: string | null) {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!orderId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await getOrderSummary(orderId);
    setSummary(data);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTaskAndRefresh = useCallback(
    async (temparioId: string) => {
      if (!orderId) return;
      const updated = await addTask(orderId, temparioId);
      setSummary(updated);
    },
    [orderId]
  );

  const toggleTaskStatus = useCallback(
    async (taskId: string, status: "pendiente" | "completada") => {
      await updateTaskStatus(taskId, status);
      await load();
    },
    [load]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      await load();
    },
    [load]
  );

  const addLineAndRefresh = useCallback(
    async (partId: string, quantity: number) => {
      if (!orderId) return;
      const updated = await addTransferLine(orderId, partId, quantity);
      setSummary(updated);
    },
    [orderId]
  );

  const markOrdered = useCallback(
    async (transferId: string) => {
      await markTransferOrdered(transferId);
      await load();
    },
    [load]
  );

  return {
    summary,
    loading,
    refresh: load,
    addTask: addTaskAndRefresh,
    toggleTaskStatus,
    removeTask,
    addTransferLine: addLineAndRefresh,
    markOrdered,
  };
}