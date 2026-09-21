"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useStockInReasons } from "@/hooks/useStockInReasons";
import SimpleCatalogView from "./SimpleCatalogView";

export default function StockInReasonsView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("ajustes");
  const { reasons, loading, error, refresh, addReason, editReason, toggleReasonActive } = useStockInReasons(filialId, true);

  return (
    <SimpleCatalogView
      description="Catálogo compartido por todo el holding — alimenta el selector de motivo al registrar una entrada de repuestos en Almacén."
      items={reasons}
      loading={loading}
      fetchError={error}
      onRetry={refresh}
      canEdit={canEdit}
      addPlaceholder="Nombre del motivo"
      addButtonLabel="Agregar motivo"
      emptyTitle="No hay motivos todavía."
      onAdd={addReason}
      onRename={editReason}
      onToggleActive={toggleReasonActive}
    />
  );
}
