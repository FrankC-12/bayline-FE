import { MODULE_CATALOG } from "./module-catalog";
import type { AccessLevel, ModulePermission, Role } from "@/types/role";

/** UI-only level: adds "sin_acceso" for modules with no row at all. */
export type UIAccessLevel = "sin_acceso" | AccessLevel;

/** Builds moduleId -> access map combining the role's default with the user's overrides. */
export function buildPermissionMap(
  role: Role | undefined,
  overrides: ModulePermission[] = []
): Record<string, UIAccessLevel> {
  const map: Record<string, UIAccessLevel> = {};

  for (const { id } of MODULE_CATALOG) {
    map[id] = "sin_acceso";
  }

  for (const perm of role?.permissions ?? []) {
    map[perm.module_id] = perm.access;
  }

  for (const override of overrides) {
    map[override.module_id] = override.access;
  }

  return map;
}

/**
 * Returns only the modules where the current map differs from the role's default.
 *
 * NOTE: the backend's UserModulePermission can only store "ver" or "editar" — there's
 * no "sin_acceso" value in that table. So a per-user override can only GRANT access
 * above the role's default; it can't yet REVOKE access the role already grants.
 * If the person picks "Sin acceso" for a module the role already allows, we silently
 * drop that from what gets sent (the UI copy explains this in CreateUserPanel).
 */
export function diffFromRole(
  permissionMap: Record<string, UIAccessLevel>,
  role: Role | undefined
): ModulePermission[] {
  const roleMap = buildPermissionMap(role);
  const diffs: ModulePermission[] = [];

  for (const [moduleId, access] of Object.entries(permissionMap)) {
    if (access === roleMap[moduleId]) continue;
    if (access === "sin_acceso") continue; // not representable by the backend yet
    diffs.push({ module_id: moduleId, access });
  }

  return diffs;
}

export function hasAccess(level: UIAccessLevel) {
  return level !== "sin_acceso";
}

export function canEdit(level: UIAccessLevel) {
  return level === "editar";
}