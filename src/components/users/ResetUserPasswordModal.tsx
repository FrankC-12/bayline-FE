"use client";
import { useState } from "react";
import Modal from "@/components/common/Modal";
import { resetUserPassword } from "@/lib/api/user";
import { notifyToast } from "@/lib/api/client";
import type { AppUser } from "@/types/user";
export default function ResetUserPasswordModal({
  user,
  onClose,
}: {
  user: AppUser;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== repeat) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      await resetUserPassword(user.id, current, password);
      setCurrent("");
      setPassword("");
      setRepeat("");
      notifyToast(
        "success",
        "Contraseña restablecida. El usuario debe iniciar sesión nuevamente.",
      );
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo restablecer la contraseña.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      open
      onClose={onClose}
      closeDisabled={busy}
      title="Restablecer contraseña"
      description={`Usuario: ${user.full_name}`}
    >
      <form onSubmit={submit} className="space-y-4 p-6">
        <p className="rounded-xl bg-blue-light p-4 text-sm text-navy">
          Se cerrarán las sesiones de este usuario. Confirma tu identidad como
          administrador para continuar.
        </p>
        {[
          {
            label: "Tu contraseña de administrador",
            value: current,
            set: setCurrent,
            autocomplete: "current-password",
            min: 1,
          },
          {
            label: "Nueva contraseña del usuario",
            value: password,
            set: setPassword,
            autocomplete: "new-password",
            min: 8,
          },
          {
            label: "Repetir nueva contraseña",
            value: repeat,
            set: setRepeat,
            autocomplete: "new-password",
            min: 8,
          },
        ].map((field) => (
          <label
            key={field.label}
            className="block text-sm font-medium text-navy"
          >
            {field.label}
            <input
              required
              type="password"
              autoComplete={field.autocomplete}
              minLength={field.min}
              maxLength={72}
              value={field.value}
              onChange={(event) => field.set(event.target.value)}
              className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm"
            />
          </label>
        ))}
        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 border-t border-navy/10 pt-4">
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="rounded-full border border-navy/15 px-4 py-2.5 text-sm font-semibold text-navy"
          >
            Cancelar
          </button>
          <button
            disabled={busy}
            className="rounded-full bg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy ? "Guardando…" : "Restablecer contraseña"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
