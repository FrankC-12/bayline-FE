"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { usePartMeasures } from "@/hooks/usePartMeasures";
import SimpleCatalogView from "./SimpleCatalogView";

export default function PartMeasuresView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("ajustes");
  const { measures, loading, addMeasure, editMeasure, toggleMeasureActive } = usePartMeasures(
    filialId,
    true
  );

  return (
    <SimpleCatalogView
      description="Catálogo compartido por todo el holding — alimenta el selector de medida al agregar un repuesto."
      items={measures}
      loading={loading}
      canEdit={canEdit}
      addPlaceholder="Nombre de la medida"
      addButtonLabel="Agregar medida"
      emptyTitle="No hay medidas todavía."
      onAdd={addMeasure}
      onRename={editMeasure}
      onToggleActive={toggleMeasureActive}
    />
  );
}
