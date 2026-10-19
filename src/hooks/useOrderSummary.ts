"use client";

import { useCallback, type SetStateAction } from "react";
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
import { useListLoader } from "./useListLoader";
import type {
  OrderSummary,
  ServiceOrderPayer,
  ServiceOrderTask,
  TaskStatus,
} from "@/types/serviceOrder";

export function useOrderSummary(orderId: string | null) {
  const {
    data,
    setData,
    loading,
    error,
    refresh: load,
  } = useListLoader<OrderSummary>(
    async () => (orderId ? [await getOrderSummary(orderId)] : []),
    [orderId],
    orderId ? 15000 : 0,
  );
  const summary = data[0] ?? null;
  const setSummary = useCallback(
    (update: SetStateAction<OrderSummary | null>) => {
      setData((current) => {
        const next =
          typeof update === "function" ? update(current[0] ?? null) : update;
        return next ? [next] : [];
      });
    },
    [setData],
  );

  const addTaskAndRefresh = useCallback(
    async (temparioId: string, payer: ServiceOrderPayer = "cliente") => {
      if (!orderId) return;
      const updated = await addTask(orderId, temparioId, payer);
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const toggleTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      await updateTaskStatus(taskId, status);
      await load();
    },
    [load],
  );

  const changeTaskPayer = useCallback(
    async (taskId: string, payer: ServiceOrderPayer) => {
      if (!orderId) return;
      const updated = await updateTaskPayer(orderId, taskId, payer);
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const removeTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      await load();
    },
    [load],
  );

  const replaceTask = useCallback(
    (updated: ServiceOrderTask) => {
      setSummary((current) =>
        current
          ? {
              ...current,
              tasks: current.tasks.map((t) =>
                t.id === updated.id ? updated : t,
              ),
            }
          : current,
      );
    },
    [setSummary],
  );

  const startTaskTimerAndRefresh = useCallback(
    async (taskId: string) => {
      replaceTask(await startTaskTimer(taskId));
    },
    [replaceTask],
  );

  const pauseTaskTimerAndRefresh = useCallback(
    async (taskId: string) => {
      replaceTask(await pauseTaskTimer(taskId));
    },
    [replaceTask],
  );

  const addLineAndRefresh = useCallback(
    async (
      partId: string,
      quantity: number,
      payer: ServiceOrderPayer = "cliente",
    ) => {
      if (!orderId) return;
      const updated = await addTransferLine(orderId, partId, quantity, payer);
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const changeLinePayer = useCallback(
    async (lineId: string, payer: ServiceOrderPayer) => {
      if (!orderId) return;
      const updated = await updateTransferLinePayer(orderId, lineId, payer);
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const changeLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      if (!orderId) return;
      const updated = await updateTransferLineQuantity(
        orderId,
        lineId,
        quantity,
      );
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      if (!orderId) return;
      const updated = await removeTransferLine(orderId, lineId);
      setSummary(updated);
    },
    [orderId, setSummary],
  );

  const markOrdered = useCallback(
    async (transferId: string) => {
      await markTransferOrdered(transferId);
      await load();
    },
    [load],
  );

  const dismissWarnings = useCallback(() => {
    setSummary((current) => (current ? { ...current, warnings: [] } : current));
  }, [setSummary]);

  return {
    summary,
    loading,
    error,
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
