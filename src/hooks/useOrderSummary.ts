"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOrderSummary,
  addTask,
  updateTaskStatus,
  updateTaskPayer,
  deleteTask,
  addTransferLine,
  updateTransferLinePayer,
  updateTransferLineQuantity,
  removeTransferLine,
  markTransferOrdered,
} from "@/lib/api/serviceOrders";
import type { OrderSummary, ServiceOrderPayer, TaskStatus } from "@/types/serviceOrder";

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
    async (temparioId: string, payer: ServiceOrderPayer = "cliente") => {
      if (!orderId) return;
      const updated = await addTask(orderId, temparioId, payer);
      setSummary(updated);
    },
    [orderId]
  );

  const toggleTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await updateTaskStatus(taskId, status);
      await load();
    },
    [load]
  );

  const changeTaskPayer = useCallback(
    async (taskId: string, payer: ServiceOrderPayer) => {
      if (!orderId) return;
      const updated = await updateTaskPayer(orderId, taskId, payer);
      setSummary(updated);
    },
    [orderId]
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      await load();
    },
    [load]
  );

  const addLineAndRefresh = useCallback(
    async (partId: string, quantity: number, payer: ServiceOrderPayer = "cliente") => {
      if (!orderId) return;
      const updated = await addTransferLine(orderId, partId, quantity, payer);
      setSummary(updated);
    },
    [orderId]
  );

  const changeLinePayer = useCallback(
    async (lineId: string, payer: ServiceOrderPayer) => {
      if (!orderId) return;
      const updated = await updateTransferLinePayer(orderId, lineId, payer);
      setSummary(updated);
    },
    [orderId]
  );

  const changeLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!orderId) return;
      const updated = await updateTransferLineQuantity(orderId, lineId, quantity);
      setSummary(updated);
    },
    [orderId]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!orderId) return;
      const updated = await removeTransferLine(orderId, lineId);
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

  const dismissWarnings = useCallback(() => {
    setSummary((current) => (current ? { ...current, warnings: [] } : current));
  }, []);

  return {
    summary,
    loading,
    refresh: load,
    addTask: addTaskAndRefresh,
    toggleTaskStatus,
    changeTaskPayer,
    removeTask,
    addTransferLine: addLineAndRefresh,
    changeLinePayer,
    changeLineQuantity,
    removeLine,
    markOrdered,
    dismissWarnings,
  };
}