"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { slugify } from "@/lib/slug";
import type { Filial } from "@/types/filial";
import type { CreateFilialInput } from "@/lib/api/filiales";

interface CreateFilialPanelProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: { name: string; slug: string }) => Promise<void>;
  editingFilial: Filial | null;
}

export default function CreateFilialPanel({
  open,
  onClose,
  onSubmit,
  editingFilial,
}: CreateFilialPanelProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
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
      await onSubmit({ name, slug });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la filial.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-navy/40 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
      />
      <aside
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <h2 className="font-display text-xl font-bold text-navy">
            {editingFilial ? "Editar filial" : "Nueva filial"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-5 p-8">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-navy">Nombre</label>
            <input
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej: Taller Este"
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
              placeholder="taller-este"
              className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
            <p className="mt-1.5 text-xs text-steel">Solo minúsculas, números y guiones.</p>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-navy/10 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {editingFilial ? "Guardar cambios" : "Crear filial"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}