"use client";

import PartImagePicker from "./PartImagePicker";
import { uploadPartImage, removePartImage } from "@/lib/api/parts";
import { useToast } from "@/contexts/ToastContext";
import Modal from "@/components/common/Modal";

import { NumberInput } from "@/components/ui/NumberInput";

import { useEffect, useMemo, useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { usePartCategories } from "@/hooks/usePartCategories";
import { useVehicleCatalog } from "@/hooks/useVehicleCatalog";
import type { CreatePartInput, UpdatePartInput } from "@/lib/api/parts";
import type { Part } from "@/types/parts";
import ActiveToggle from "@/components/common/ActiveToggle";

const selectClass =
  "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel";
const inputClass =
  "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20";

interface PartForm {
  code: string;
  manufacturerPartNumber: string;
  name: string;
  categoryId: string;
  vehicleBrandId: string;
  vehicleModelId: string;
  yearFrom: string;
  yearTo: string;
  unit: string;
  minStock: string;
}

function emptyForm(initialName = ""): PartForm {
  return {
    code: "",
    manufacturerPartNumber: "",
    name: initialName,
    categoryId: "",
    vehicleBrandId: "",
    vehicleModelId: "",
    yearFrom: "",
    yearTo: "",
    unit: "",
    minStock: "10",
  };
}

interface CreatePartModalProps {
  open: boolean;
  onClose: () => void;
  filialId: string;
  editingPart?: Part | null;
  /** Prefills "Nombre" — e.g. the text someone typed in a search box that
   * matched nothing, so they don't have to retype it here. */
  initialName?: string;
  onCreate: (input: CreatePartInput) => Promise<Part>;
  onUpdate?: (id: string, input: UpdatePartInput) => Promise<Part>;
  onToggleActive?: (id: string, isActive: boolean) => Promise<unknown>;
  /** Called with the created/updated part right before the modal closes. */
  onSaved?: (part: Part) => void;
}

export default function CreatePartModal({
  open,
  onClose,
  filialId,
  editingPart,
  initialName = "",
  onCreate,
  onUpdate,
  onToggleActive,
  onSaved,
}: CreatePartModalProps) {
  const formId = useId();
  const toast = useToast();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const { categories } = usePartCategories(filialId);
  const { brands } = useVehicleCatalog(filialId);
  const [editingIsActive, setEditingIsActive] = useState(true);
  const [form, setForm] = useState<PartForm>(emptyForm(initialName));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const models = useMemo(
    () => brands.find((b) => b.id === form.vehicleBrandId)?.models ?? [],
    [brands, form.vehicleBrandId],
  );

  useEffect(() => {
    if (!open) return;
    setImageFile(null);
    setImageRemoved(false);
    if (editingPart) {
      setEditingIsActive(editingPart.is_active);
      setForm({
        code: editingPart.code,
        manufacturerPartNumber: editingPart.manufacturer_part_number ?? "",
        name: editingPart.name,
        categoryId: editingPart.category_id,
        vehicleBrandId: editingPart.vehicle_brand_id ?? "",
        vehicleModelId: editingPart.vehicle_model_id ?? "",
        yearFrom:
          editingPart.year_from != null ? String(editingPart.year_from) : "",
        yearTo: editingPart.year_to != null ? String(editingPart.year_to) : "",
        unit: editingPart.unit,
        minStock: String(editingPart.min_stock),
      });
    } else {
      setEditingIsActive(true);
      setForm(emptyForm(initialName));
    }
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editingPart]);

  function updateField<K extends keyof PartForm>(field: K, value: PartForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !form.code.trim() ||
      !form.name.trim() ||
      !form.categoryId ||
      !form.unit.trim()
    ) {
      setError("Código, nombre, categoría y unidad son obligatorios.");
      return;
    }
    if (
      form.yearFrom &&
      form.yearTo &&
      Number(form.yearFrom) > Number(form.yearTo)
    ) {
      setError("El año 'desde' no puede ser mayor al año 'hasta'.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let saved: Part;
      if (editingPart) {
        const payload: UpdatePartInput = {
          code: form.code.trim(),
          name: form.name.trim(),
          category_id: form.categoryId,
          unit: form.unit.trim(),
          min_stock: Number(form.minStock) || 0,
          manufacturer_part_number:
            form.manufacturerPartNumber.trim() || undefined,
          vehicle_brand_id: form.vehicleBrandId || undefined,
          vehicle_model_id: form.vehicleModelId || undefined,
          year_from: form.yearFrom ? Number(form.yearFrom) : undefined,
          year_to: form.yearTo ? Number(form.yearTo) : undefined,
          clear_manufacturer_part_number: !form.manufacturerPartNumber.trim(),
          clear_vehicle_brand: !form.vehicleBrandId,
          clear_vehicle_model: !form.vehicleModelId,
          clear_years: !form.yearFrom && !form.yearTo,
        };
        saved = await onUpdate!(editingPart.id, payload);
      } else {
        const payload: CreatePartInput = {
          filial_id: filialId,
          code: form.code.trim(),
          manufacturer_part_number: form.manufacturerPartNumber.trim() || null,
          name: form.name.trim(),
          category_id: form.categoryId,
          vehicle_brand_id: form.vehicleBrandId || null,
          vehicle_model_id: form.vehicleModelId || null,
          year_from: form.yearFrom ? Number(form.yearFrom) : null,
          year_to: form.yearTo ? Number(form.yearTo) : null,
          unit: form.unit.trim(),
          min_stock: Number(form.minStock) || 10,
        };
        saved = await onCreate(payload);
      }
      try {
        if (imageFile) saved = await uploadPartImage(saved.id, imageFile);
        else if (imageRemoved && editingPart?.image_url)
          saved = await removePartImage(saved.id);
      } catch (error) {
        toast.error(
          `El repuesto se guardó, pero no se pudo actualizar su imagen. Puedes reintentar desde el detalle. ${error instanceof Error ? error.message : ""}`,
        );
      }
      onSaved?.(saved);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el repuesto.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingPart ? "Editar repuesto" : "Nuevo repuesto"}
      size="lg"
      closeDisabled={submitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingPart ? "Guardar cambios" : "Crear repuesto"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="space-y-5 p-5 sm:p-7"
      >
        <PartImagePicker
          imageUrl={imageRemoved ? null : editingPart?.image_url}
          file={imageFile}
          name={form.name || "repuesto"}
          disabled={submitting}
          onChange={(file) => {
            setImageFile(file);
            setImageRemoved(!file);
          }}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Código interno
          </label>
          <input
            required
            value={form.code}
            onChange={(e) => updateField("code", e.target.value)}
            placeholder="08880-83840"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Número de parte del fabricante (opcional)
          </label>
          <input
            value={form.manufacturerPartNumber}
            onChange={(e) =>
              updateField("manufacturerPartNumber", e.target.value)
            }
            placeholder="90915-YZZD4"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Nombre
          </label>
          <input
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="Aceite motor 5W-30"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Categoría
          </label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => updateField("categoryId", e.target.value)}
            className={selectClass}
          >
            <option value="">Selecciona...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Fabricante (opcional)
            </label>
            <select
              value={form.vehicleBrandId}
              onChange={(e) => {
                updateField("vehicleBrandId", e.target.value);
                updateField("vehicleModelId", "");
              }}
              className={selectClass}
            >
              <option value="">Universal</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Modelo
            </label>
            <select
              value={form.vehicleModelId}
              onChange={(e) => updateField("vehicleModelId", e.target.value)}
              disabled={!form.vehicleBrandId || models.length === 0}
              className={selectClass}
            >
              <option value="">
                {form.vehicleBrandId && models.length === 0
                  ? "Sin modelos cargados"
                  : "Todos"}
              </option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Año desde
            </label>
            <input
              type="number"
              min="1900"
              max="2100"
              step="1"
              placeholder="Sin límite"
              value={form.yearFrom}
              onChange={(e) => updateField("yearFrom", e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Año hasta
            </label>
            <input
              type="number"
              min="1900"
              max="2100"
              step="1"
              placeholder="Sin límite"
              value={form.yearTo}
              onChange={(e) => updateField("yearTo", e.target.value)}
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue"
            />
          </div>
        </div>
        <p className="-mt-3 text-xs text-steel">
          Años vacíos = aplica a todos los años (universal).
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Unidad
            </label>
            <input
              required
              value={form.unit}
              onChange={(e) => updateField("unit", e.target.value)}
              placeholder="Litro, Unidad, Kit..."
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">
              Stock mínimo (punto de reorden)
            </label>
            <NumberInput
              min="0"
              required
              value={form.minStock}
              onValueChange={(value) => updateField("minStock", value)}
              className={inputClass}
            />
          </div>
        </div>

        {editingPart && onToggleActive && (
          <div className="flex items-center justify-between rounded-xl border border-navy/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-navy">
                Estado del repuesto
              </p>
              <p className="text-xs text-steel">
                Nunca se elimina, solo se desactiva.
              </p>
            </div>
            <ActiveToggle
              isActive={editingIsActive}
              disabled={submitting}
              onToggle={async () => {
                setSubmitting(true);
                try {
                  await onToggleActive(editingPart.id, !editingIsActive);
                  setEditingIsActive((v) => !v);
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "No se pudo cambiar el estado.",
                  );
                } finally {
                  setSubmitting(false);
                }
              }}
              label={
                editingIsActive ? "Desactivar repuesto" : "Activar repuesto"
              }
            />
          </div>
        )}

        <p className="text-xs text-steel">
          El stock, el precio de referencia y la ubicación en almacén se
          calculan automáticamente desde los lotes de almacén (ubicación = la
          del movimiento de entrada más reciente) y no se editan en el catálogo.
        </p>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
