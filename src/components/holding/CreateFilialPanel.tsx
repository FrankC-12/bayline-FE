"use client";

import Modal from "@/components/common/Modal";

import { useEffect, useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import type { UpdateFilialInput } from "@/lib/api/filiales";
import type { Filial } from "@/types/filial";

interface CreateFilialPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (
    input: { name: string; slug: string } & UpdateFilialInput,
  ) => Promise<void>;
  editingFilial: Filial | null;
}

export default function CreateFilialPanel({
  open,
  onClose,
  onSubmit,
  editingFilial,
}: CreateFilialPanelProps) {
  const formId = useId();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fiscal, setFiscal] = useState<UpdateFilialInput>({});
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingFilial) {
      setName(editingFilial.name);
      setSlug(editingFilial.slug);
      setSlugTouched(true);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
    setFiscal(
      editingFilial
        ? {
            legal_name: editingFilial.legal_name ?? "",
            rif: editingFilial.rif ?? "",
            fiscal_address: editingFilial.fiscal_address ?? "",
            business_type: editingFilial.business_type ?? "concesionario",
            represented_brands: editingFilial.represented_brands ?? "",
            special_taxpayer: editingFilial.special_taxpayer ?? false,
            invoice_series: editingFilial.invoice_series ?? "",
          }
        : { business_type: "concesionario" },
    );
    setError(null);
  }, [editingFilial, open]);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !slug) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        name,
        slug,
        ...Object.fromEntries(
          Object.entries(fiscal).filter(([, value]) => value !== ""),
        ),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar la filial.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingFilial ? "Editar filial" : "Nueva filial"}
      size="md"
      closeDisabled={submitting}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editingFilial ? "Guardar cambios" : "Crear filial"}
          </button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit}
        className="space-y-5 p-5 sm:p-7"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Nombre
          </label>
          <input
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Ej: Taller Este"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-navy">
            Slug
          </label>
          <input
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            pattern="^[a-z0-9-]+$"
            placeholder="taller-este"
            className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
          />
          <p className="mt-1.5 text-xs text-steel">
            Solo minúsculas, números y guiones.
          </p>
        </div>

        <p className="text-xs text-steel">
          Concesionario afiliado a la red del importador/distribuidor; no
          implica propiedad societaria.
        </p>
        {(
          [
            ["legal_name", "Razón social", 200],
            ["rif", "RIF", 20],
            ["fiscal_address", "Dirección fiscal", 500],
            ["represented_brands", "Marcas representadas", 300],
            ["invoice_series", "Serie de facturación", 20],
          ] as const
        ).map(([field, label, maxLength]) => (
          <label key={field} className="block text-sm font-medium text-navy">
            {label}
            <input
              required={!editingFilial}
              maxLength={maxLength}
              value={String(fiscal[field] ?? "")}
              onChange={(e) =>
                setFiscal((old) => ({ ...old, [field]: e.target.value }))
              }
              className="mt-1 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm"
            />
          </label>
        ))}
        <label className="block text-sm font-medium text-navy">
          Tipo de establecimiento
          <select
            value={fiscal.business_type ?? "concesionario"}
            onChange={(e) =>
              setFiscal((old) => ({
                ...old,
                business_type: e.target.value as
                  "concesionario" | "taller" | "mixto",
              }))
            }
            className="mt-1 w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm"
          >
            <option value="concesionario">Concesionario</option>
            <option value="taller">Taller</option>
            <option value="mixto">Concesionario y taller</option>
          </select>
        </label>
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={fiscal.special_taxpayer ?? false}
            onChange={(e) =>
              setFiscal((old) => ({
                ...old,
                special_taxpayer: e.target.checked,
              }))
            }
          />
          Contribuyente especial
        </label>
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}
