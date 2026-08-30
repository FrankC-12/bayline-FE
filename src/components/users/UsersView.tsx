"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUsers } from "@/hooks/useUser";
import { useRoles } from "@/hooks/useRoles";
import type { AppUser, UserStatus } from "@/types/user";
import type { CreateUserInput } from "@/lib/api/user";
import UsersToolbar from "./UsersToolbar";
import UserTable from "./UserTable";
import CreateUserPanel from "./CreateUserPanel";

export default function UsersView() {
  const { currentUser } = useAuth();
  const filialId = currentUser?.filialId ?? null;
  const canManage = currentUser?.roleSlug === "filial-admin";

  const { users, loading, addUser, editUser } = useUsers({ filialId });
  const { roles } = useRoles("filial");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "todos">("todos");
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === "todos" || u.role_id === roleFilter;
      const matchesStatus = statusFilter === "todos" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  function openCreate() {
    setEditingUser(null);
    setPanelOpen(true);
  }

  function openEdit(user: AppUser) {
    setEditingUser(user);
    setPanelOpen(true);
  }

  async function handleSubmit(input: CreateUserInput) {
    if (editingUser) {
      await editUser(editingUser.id, {
        full_name: input.full_name,
        role_id: input.role_id,
        filial_id: input.filial_id,
        permission_overrides: input.permission_overrides,
      });
    } else {
      await addUser(input);
    }
  }

  if (!filialId) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-steel">No se encontró una filial asociada a tu cuenta.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-steel hover:text-navy"
      >
        <ChevronLeft className="h-4 w-4" />
        Volver al Dashboard
      </Link>

      <div className="mb-8">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">Súper Admin</span>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">Usuarios y Accesos</h1>
        <p className="mt-1 text-sm text-steel">
          Administra quién entra a Bayline y qué módulos puede ver, dentro de tu filial.
        </p>
      </div>

      <div className="mb-6">
        <UsersToolbar
          search={search}
          onSearchChange={setSearch}
          roleFilter={roleFilter}
          onRoleFilterChange={setRoleFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          roles={roles}
          canCreate={canManage}
          onCreateClick={openCreate}
        />
      </div>

      <UserTable
        users={filteredUsers}
        roles={roles}
        loading={loading}
        canManage={canManage}
        onEdit={openEdit}
      />

      {canManage && (
        <CreateUserPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          roles={roles}
          filialId={filialId}
          onSubmit={handleSubmit}
          editingUser={editingUser}
        />
      )}
    </div>
  );
}