"use client";
import { useEffect, useState } from "react";
import { ShieldCheck, Smartphone } from "lucide-react";
import {
  getRecoveryPhone,
  requestPhoneVerification,
  verifyRecoveryPhone,
  type IssuedOtp,
} from "@/lib/api/recovery";
export default function RecoverySecurityView() {
  const [profile, setProfile] = useState<Awaited<
    ReturnType<typeof getRecoveryPhone>
  > | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [ticket, setTicket] = useState<IssuedOtp | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    getRecoveryPhone()
      .then((data) => {
        if (active) {
          setProfile(data);
          setPhone(data.phone || "");
        }
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar tu teléfono.",
          );
      });
    return () => {
      active = false;
    };
  }, [reload]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSuccess(false);
    try {
      if (!ticket) {
        setTicket(
          await requestPhoneVerification(
            phone.replace(/[\s-]/g, ""),
            currentPassword,
          ),
        );
        setCurrentPassword("");
      } else {
        await verifyRecoveryPhone(ticket.challenge_id, code);
        setTicket(null);
        setCode("");
        setSuccess(true);
        setReload((value) => value + 1);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo verificar el teléfono.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-navy">
        Seguridad y recuperación
      </h1>
      <p className="mt-2 text-sm text-steel">
        Tu correo de acceso es el canal principal. Verifica un teléfono para
        habilitar la recuperación por SMS.
      </p>
      <section className="mt-6 rounded-2xl border border-navy/10 bg-white p-6">
        <div className="flex items-center gap-3">
          <Smartphone aria-hidden="true" className="h-6 w-6 text-blue" />
          <h2 className="font-semibold text-navy">Teléfono de recuperación</h2>
        </div>
        {profile?.verified && (
          <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            <ShieldCheck className="h-4 w-4" />
            {profile.phone} · Verificado
          </p>
        )}
        {profile && !profile.sms_available && (
          <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
            La verificación por SMS no está disponible en este momento.
          </p>
        )}
        <form onSubmit={submit} className="mt-5 space-y-4">
          {!ticket ? (
            <label className="block text-sm font-medium text-navy">
              Teléfono con código de país
              <input
                required
                type="tel"
                placeholder="+584121234567"
                pattern="\+[1-9][0-9]{7,14}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm"
              />
            </label>
          ) : (
            <label className="block text-sm font-medium text-navy">
              Código enviado a {ticket.destination}
              <input
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 font-mono text-sm"
              />
            </label>
          )}
          {!ticket && (
            <label className="block text-sm font-medium text-navy">
              Contraseña actual
              <input
                required
                type="password"
                autoComplete="current-password"
                maxLength={72}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-navy/15 px-4 py-3 text-sm"
              />
              <span className="mt-1 block text-xs text-steel">
                Confirma tu identidad antes de registrar o cambiar el teléfono
                de recuperación.
              </span>
            </label>
          )}
          <button
            disabled={busy || !profile?.sms_available}
            className="rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy
              ? "Procesando…"
              : ticket
                ? "Verificar teléfono"
                : "Enviar código por SMS"}
          </button>
          {ticket && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setTicket(null);
                setCode("");
              }}
              className="ml-4 text-sm text-blue"
            >
              Cambiar número o solicitar otro código
            </button>
          )}
        </form>
        {success && (
          <p
            role="status"
            className="mt-4 text-sm font-medium text-emerald-700"
          >
            Teléfono verificado. Ya puedes usarlo para recuperar tu contraseña.
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => {
                setError(null);
                setReload((value) => value + 1);
              }}
              className="ml-3 underline"
            >
              Reintentar
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
