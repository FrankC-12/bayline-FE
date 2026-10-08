"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getOrderSummary,
  addTask,
  updateTaskStatus,
  updateTaskPayer,
  deleteTask,
  startTaskTimer,
  pauseTaskTimer,
  addTransferLine,
  updateTransferLinePayer,
  updateTransferLineQuantity,
  removeTransferLine,
  markTransferOrdered,
} from "@/lib/api/serviceOrders";
import { useAutoRefresh } from "./useAutoRefresh";
import type { OrderSummary, ServiceOrderPayer, ServiceOrderTask, TaskStatus } from "@/types/serviceOrder";

export function useOrderSummary(orderId: string | null) {
  const [summary, setSummary] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (background = false) => {
    if (!orderId) {
      setSummary(null);
      setLoading(false);
      return;
    }
    if (!background) setLoading(true);
    try {
      const data = await getOrderSummary(orderId);
      setSummary(data);
    } finally {
      if (!background) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    load();
  }, [load]);

  const refreshQuietly = useCallback(() => load(true), [load]);
  useAutoRefresh(refreshQuietly, orderId ? 15000 : 0);

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

  const replaceTask = useCallback((updated: ServiceOrderTask) => {
    setSummary((current) =>
      current
        ? { ...current, tasks: current.tasks.map((t) => (t.id === updated.id ? updated : t)) }
        : current
    );
  }, []);

  const startTaskTimerAndRefresh = useCallback(
    async (taskId: string) => {
      replaceTask(await startTaskTimer(taskId));
    },
    [replaceTask]
  );

  const pauseTaskTimerAndRefresh = useCallback(
    async (taskId: string) => {
      replaceTask(await pauseTaskTimer(taskId));
    },
    [replaceTask]
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
    startTaskTimer: startTaskTimerAndRefresh,
    pauseTaskTimer: pauseTaskTimerAndRefresh,
    addTransferLine: addLineAndRefresh,
    changeLinePayer,
    changeLineQuantity,
    removeLine,
    markOrdered,
    dismissWarnings,
  };
}