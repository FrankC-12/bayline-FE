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
 * A per-user override can both GRANT access above the role's default and
 * REVOKE access the role already grants — "sin_acceso" is a real value the
 * backend's UserModulePermission can store, it just always means "explicit
 * override that denies this module," never a valid RoleModulePermission.
 */
export function diffFromRole(
  permissionMap: Record<string, UIAccessLevel>,
  role: Role | undefined
): ModulePermission[] {
  const roleMap = buildPermissionMap(role);
  const diffs: ModulePermission[] = [];

  for (const [moduleId, access] of Object.entries(permissionMap)) {
    if (access === roleMap[moduleId]) continue;
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