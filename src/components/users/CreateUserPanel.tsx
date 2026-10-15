"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { Loader2, Eye, EyeOff } from "lucide-react";
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
  const formId=useId();
  const baseline=useRef("");
  const submitLock=useRef(false);
  const [confirmClose,setConfirmClose]=useState(false);
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

  const serialized=JSON.stringify({fullName,email,password,roleId,permissionMap});
  function requestClose(){if(submitting) return;if(serialized!==baseline.current){setConfirmClose(true);return;}onClose();}

  useEffect(() => {
    if(!open) return;
    setConfirmClose(false);setShowPassword(false);
    const initialRole=roles.find(role=>role.id===editingUser?.role_id) ?? (!editingUser ? roles[0] : undefined);
    baseline.current=JSON.stringify({fullName:editingUser?.full_name ?? "",email:editingUser?.email ?? "",password:"",roleId:editingUser?.role_id ?? roles[0]?.id ?? "",permissionMap:buildPermissionMap(initialRole,editingUser?.permission_overrides)});
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
    if (submitLock.current || !fullName.trim() || !email || !roleId) return;
    submitLock.current=true;
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
      submitLock.current=false;
      setSubmitting(false);
    }
  }

  return (<>
      <Modal open={open} onClose={requestClose} title={editingUser ? "Editar usuario" : "Nuevo usuario"} description="Datos de la cuenta, rol y permisos por módulo." closeDisabled={submitting} interactionPaused={confirmClose} footer={<><button type="button" disabled={submitting} onClick={requestClose} className="rounded-full border border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy">Cancelar</button><button type="submit" form={formId} disabled={submitting} className="inline-flex items-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{submitting && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin"/>}{editingUser ? "Guardar cambios" : "Crear usuario"}</button></>}>
        <form id={formId} onSubmit={handleSubmit} className="space-y-6 p-5 sm:p-7">
          <fieldset disabled={submitting} className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor={`${formId}-name`}>Nombre completo</label>
              <input
                id={`${formId}-name`}
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej: María Pérez"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor={`${formId}-email`}>Correo electrónico</label>
              <input
                required
                type="email"
                id={`${formId}-email`}
                readOnly={!!editingUser}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@empresa.com"
                className="w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor={`${formId}-role`}>Rol</label>
              <select
                id={`${formId}-role`}
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
                <label className="mb-1.5 block text-sm font-medium text-navy" htmlFor={`${formId}-password`}>Contraseña</label>
                <div className="relative">
                  <input
                    id={`${formId}-password`}
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
                Un permiso individual puede tanto <span className="font-medium">otorgar</span> como{" "}
                <span className="font-medium">revocar</span> acceso a un módulo respecto de lo que trae el rol.
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


          </fieldset>
        </form>
      </Modal>
      <ConfirmDialog open={confirmClose} title="Cambios sin guardar" description="Los cambios de este usuario todavía no se han guardado. ¿Deseas descartarlos?" confirmLabel="Descartar cambios" cancelLabel="Seguir editando" onCancel={()=>setConfirmClose(false)} onConfirm={()=>{setConfirmClose(false);onClose();}}/>
    </>
  );
}
