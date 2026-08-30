"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Eye, EyeOff } from "lucide-react";
import type { Role } from "@/types/role";
import type { AppUser } from "@/types/user";
import type { CreateUserInput } from "@/lib/api/user";
import { buildPermissionMap, diffFromRole, type UIAccessLevel } from "@/lib/permissions";
import PermissionsMatrix from "./PermissionMatrix";
import RoleAccessPreview from "./RoleAccessPreview";

interface CreateUserPanelProps {
  open: boolean;
  onClose: () => void;
  roles: Role[];
  filialId: string;
  onSubmit: (input: CreateUserInput) => Promise<void>;
  editingUser: AppUser | null;
}

export default function CreateUserPanel({
  open,
  onClose,
  roles,
  filialId,
  onSubmit,
  editingUser,
}: CreateUserPanelProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [roleId, setRoleId] = useState("");
  const [permissionMap, setPermissionMap] = useState<Record<string, UIAccessLevel>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedRole = roles.find((r) => r.id === roleId);
  const defaultMap = useMemo(() => buildPermissionMap(selectedRole), [selectedRole]);

  useEffect(() => {
    if (editingUser) {
      const role = roles.find((r) => r.id === editingUser.role_id);
      setFullName(editingUser.full_name);
      setEmail(editingUser.email);
      setPassword("");
      setRoleId(editingUser.role_id);
      setPermissionMap(buildPermissionMap(role, editingUser.permission_overrides));
    } else {
      const firstRole = roles[0];
      setFullName("");
      setEmail("");
      setPassword("");
      setRoleId(firstRole?.id ?? "");
      setPermissionMap(buildPermissionMap(firstRole));
    }
    setError(null);
  }, [editingUser, open, roles]);

  function handleRoleChange(newRoleId: string) {
    setRoleId(newRoleId);
    const role = roles.find((r) => r.id === newRoleId);
    setPermissionMap(buildPermissionMap(role));
  }

  function handlePermissionChange(moduleId: string, level: UIAccessLevel) {
    setPermissionMap((prev) => ({ ...prev, [moduleId]: level }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName || !email || !roleId) return;
    setSubmitting(true);
    setError(null);
    try {
      const overrides = diffFromRole(permissionMap, selectedRole);
      await onSubmit({
        full_name: fullName,
        email,
        role_id: roleId,
        filial_id: filialId,
        password: password || undefined,
        permission_overrides: overrides,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el usuario.");
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
        className={`absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-navy/10 px-8 py-5">
          <h2 className="font-display text-xl font-bold text-navy">
            {editingUser ? "Editar usuario" : "Nuevo usuario"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-steel hover:bg-ash hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-8 p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy">Nombre completo</label>
              <input
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María Pérez"
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
              <label className="mb-1.5 block text-sm font-medium text-navy">Rol</label>
              <select
                required
                value={roleId}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
              >
                <option value="" disabled>
                  Selecciona un rol
                </option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {selectedRole?.description && (
                <p className="mt-1.5 text-xs text-steel">{selectedRole.description}</p>
              )}
            </div>

            {!editingUser && (
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
                  Si la dejas vacía, el usuario queda como &quot;invitado&quot;.
                </p>
              </div>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-navy">Permisos por módulo</h3>
                <span className="text-xs text-steel">Parte del rol, ajustable para este usuario</span>
              </div>
              <PermissionsMatrix
                permissionMap={permissionMap}
                defaultMap={defaultMap}
                onChange={handlePermissionChange}
              />
              <p className="mt-2 text-xs text-steel">
                Nota: hoy un permiso individual solo puede <span className="font-medium">otorgar</span>{" "}
                ver/editar por encima del rol — todavía no se puede quitar acceso a un módulo que el rol
                ya habilita para todos.
              </p>
            </div>

            <div>
              <RoleAccessPreview
                fullName={fullName}
                roleName={selectedRole?.name}
                permissionMap={permissionMap}
              />
            </div>
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
              {editingUser ? "Guardar cambios" : "Crear usuario"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}