"use client";

import Modal from "@/components/common/Modal";

import { useEffect, useState, useId } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRoleBySlug } from "@/hooks/useRoleBySlug";
import { createUser } from "@/lib/api/user";
import type { Filial } from "@/types/filial";

interface CreateFilialUserPanelProps {
  open: boolean;
  onClose: () => void;
  filial: Filial | null;
}

export default function CreateFilialUserPanel({ open, onClose, filial }: CreateFilialUserPanelProps) {
  const formId=useId();
  const { role, loading: roleLoading } = useRoleBySlug("filial-admin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setFullName("");
      setEmail("");
      setPassword("");
      setError(null);
      setSuccess(false);
    }
  }, [open, filial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!filial || !role) return;
    setSubmitting(true);
    setError(null);
    try {
      await createUser({
        full_name: fullName,
        email,
        role_id: role.id,
        holding_id: filial.holding_id,
        filial_id: filial.id,
        password: password || undefined,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear el usuario.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo administrador de filial" size="md" closeDisabled={submitting} footer={!success && <><button
                  type="button"
                  onClick={onClose} disabled={submitting}
                  className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy transition hover:border-navy/40"
                >
                  Cancelar
                </button>
                <button
                  type="submit" form={formId}
                  disabled={submitting || roleLoading || !role}
                  className="flex items-center justify-center gap-2 rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy disabled:opacity-70"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Crear usuario
                </button></>}>
      <div className="p-5 sm:p-7">
          {filial && (
            <p className="mb-6 rounded-xl bg-blue-light px-4 py-3 text-sm text-blue">
              Este usuario será el <span className="font-semibold">Súper Administrador</span> de{" "}
              <span className="font-semibold">{filial.name}</span> — verá todos sus módulos y podrá
              crear el resto de los usuarios de esa filial.
            </p>
          )}

          {success ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              <p className="font-semibold">Usuario creado correctamente.</p>
              <p className="mt-1">
                {email} ya puede iniciar sesión
                {password
                  ? " con la contraseña que definiste."
                  : ", una vez que le asignes una contraseña."}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-4 rounded-full bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy"
              >
                Listo
              </button>
            </div>
          ) : (
            <form id={formId} onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Nombre completo</label>
                <input
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Ana Rondón"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Correo electrónico</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Déjalo vacío para invitarlo"
                    minLength={8}
                    className="w-full rounded-xl border border-navy/15 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-steel hover:text-navy"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-steel">
                  Si la dejas vacía, el usuario queda como &quot;invitado&quot; hasta que definas una
                  contraseña más adelante.
                </p>
              </div>

              {roleLoading && (
                <p className="text-xs text-steel">Cargando el rol de Súper Administrador...</p>
              )}

              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}


            </form>
          )}
        </div>
    </Modal>
  );
}
