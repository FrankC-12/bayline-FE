"use client";

import Modal from "@/components/common/Modal";

import { useEffect, useState, useId } from "react";
import { Loader2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import type { Holding } from "@/types/holding";
import type { CreateHoldingInput } from "@/lib/api/holding";

interface CreateHoldingPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: CreateHoldingInput) => Promise<void>;
  editingHolding: Holding | null;
}

export default function CreateHoldingPanel({
  open,
  onClose,
  onSubmit,
  editingHolding,
}: CreateHoldingPanelProps) {
  const formId=useId();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingHolding) {
      setName(editingHolding.name);
      setSlug(editingHolding.slug);
      setSlugTouched(true);
    } else {
      setName("");
      setSlug("");
      setSlugTouched(false);
    }
    setError(null);
  }, [editingHolding, open]);

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
      await onSubmit({ name, slug });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el holding.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editingHolding ? "Editar holding" : "Nuevo holding"} size="md" closeDisabled={submitting} footer={<><button
              type="button"
              onClick={onClose} disabled={submitting}
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              Cancelar
            </button>
            <button
              type="submit" form={formId}
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingHolding ? "Guardar cambios" : "Crear holding"}
            </button></>}>
      <form id={formId} onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-7">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Acqua Fontana Holding"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Slug</label>
            <input
              required
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              pattern="^[a-z0-9-]+$"
              placeholder="acqua-fontana"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
            <p className="mt-1.5 text-xs text-steel">Solo minúsculas, números y guiones.</p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}


        </form>
    </Modal>
  );
}
