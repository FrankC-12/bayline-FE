"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { usePartCategories } from "@/hooks/usePartCategories";
import SimpleCatalogView from "./SimpleCatalogView";

export default function PartCategoriesView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const { canEdit } = useModuleAccess("ajustes");
  const { categories, loading, error, refresh, addCategory, editCategory, toggleCategoryActive } = usePartCategories(
    filialId,
    true
  );

  return (
    <SimpleCatalogView
      description="Catálogo compartido por todo el holding — alimenta el selector de categoría al agregar un repuesto."
      items={categories}
      loading={loading}
      fetchError={error}
      onRetry={refresh}
      canEdit={canEdit}
      addPlaceholder="Nombre de la categoría"
      addButtonLabel="Agregar categoría"
      emptyTitle="No hay categorías todavía."
      onAdd={addCategory}
      onRename={editCategory}
      onToggleActive={toggleCategoryActive}
    />
  );
}
