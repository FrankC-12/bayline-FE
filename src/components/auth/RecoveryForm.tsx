"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Smartphone,
  ShieldCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import {
  recoveryOptions,
  requestRecovery,
  resetPassword,
  type RecoveryOptions,
  type IssuedOtp,
} from "@/lib/api/recovery";
export default function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [options, setOptions] = useState<RecoveryOptions | null>(null);
  const [ticket, setTicket] = useState<IssuedOtp | null>(null);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!ticket) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [ticket]);
  async function lookup(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setOptions(await recoveryOptions(email.trim().toLowerCase()));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo consultar la cuenta.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function send(selected: "email" | "sms") {
    setBusy(true);
    setError(null);
    try {
      setTicket(await requestRecovery(email.trim().toLowerCase(), selected));
      setChannel(selected);
      setCode("");
      const time = Date.now();
      setNow(time);
      setResendAt(time + 60000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo enviar el código.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function reset(event: React.FormEvent) {
    event.preventDefault();
    if (!ticket) return;
    if (password !== repeat) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resetPassword(ticket.challenge_id, code, password);
      setPassword("");
      setRepeat("");
      setCode("");
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setBusy(false);
    }
  }
  const input =
    "w-full rounded-xl border border-navy/15 px-4 py-3 text-sm text-navy outline-none focus:border-blue focus:ring-2 focus:ring-blue/10";
  return (
    <div className="flex min-h-screen items-center justify-center bg-ash px-5 py-12">
      <section className="w-full max-w-lg rounded-3xl border border-navy/10 bg-white p-7 shadow-sm sm:p-9">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-steel hover:text-blue"
        >
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Volver al inicio de sesión
        </Link>
        <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-light text-blue">
          <ShieldCheck aria-hidden="true" className="h-6 w-6" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold text-navy">
          Recuperar contraseña
        </h1>
        {done ? (
          <div role="status" className="mt-5 space-y-4">
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              Contraseña actualizada. Tus sesiones anteriores se cerraron.
              Inicia sesión con la nueva contraseña.
            </p>
            <button
              onClick={() => window.location.assign("/login")}
              className="w-full rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white"
            >
              Ir a iniciar sesión
            </button>
          </div>
        ) : (
          <>
            {!options ? (
              <form onSubmit={lookup} className="mt-5 space-y-4">
                <p className="text-sm leading-relaxed text-steel">
                  Ingresa el correo de tu cuenta para consultar las opciones
                  disponibles.
                </p>
                <label className="block text-sm font-medium text-navy">
                  Correo electrónico
                  <input
                    type="email"
                    required
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${input} mt-2`}
                  />
                </label>
                <button
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  Continuar
                </button>
              </form>
            ) : options.action !== "otp" ? (
              <div className="mt-5">
                <p
                  role="status"
                  className="rounded-xl bg-amber-50 p-5 text-sm leading-relaxed text-amber-900"
                >
                  {options.message}
                </p>
                <button
                  onClick={() => {
                    setOptions(null);
                    setError(null);
                  }}
                  className="mt-4 text-sm font-semibold text-blue"
                >
                  Usar otro correo
                </button>
              </div>
            ) : !ticket ? (
              <div className="mt-5 space-y-3">
                <p className="text-sm text-steel">{options.message}</p>
                {options.channels.map((item) => {
                  const Icon = item.channel === "email" ? Mail : Smartphone;
                  return (
                    <button
                      key={item.channel}
                      onClick={() => void send(item.channel)}
                      disabled={!item.available || busy}
                      className="flex w-full items-center gap-3 rounded-xl border border-navy/15 p-4 text-left transition hover:border-blue disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60"
                    >
                      <Icon aria-hidden="true" className="h-5 w-5 text-blue" />
                      <span>
                        <strong className="block text-sm text-navy">
                          {item.channel === "email"
                            ? "Código por correo"
                            : "Código por SMS"}
                        </strong>
                        <span className="mt-1 block text-xs text-steel">
                          {item.destination}
                          {!item.available && " · No disponible"}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {options.channels.every((item) => !item.available) && (
                  <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                    No hay un canal disponible para recuperar tu cuenta en este
                    momento. Contacta a la administración.
                  </p>
                )}
                <button
                  disabled={busy}
                  onClick={() => {
                    setOptions(null);
                    setError(null);
                  }}
                  className="text-sm font-semibold text-blue"
                >
                  Usar otro correo
                </button>
              </div>
            ) : (
              <form onSubmit={reset} className="mt-5 space-y-4">
                <p className="rounded-xl bg-blue-light p-4 text-sm text-navy">
                  Enviamos un código a {ticket.destination}. Vence en{" "}
                  {Math.ceil(ticket.expires_in / 60)} minutos.
                </p>
                <label className="block text-sm font-medium text-navy">
                  Código de 6 dígitos
                  <input
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    className={`${input} mt-2 font-mono tracking-[0.4em]`}
                  />
                </label>
                <label className="block text-sm font-medium text-navy">
                  Nueva contraseña
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${input} mt-2`}
                  />
                  <span className="mt-1 block text-xs text-steel">
                    Mínimo 8 caracteres.
                  </span>
                </label>
                <label className="block text-sm font-medium text-navy">
                  Repetir contraseña
                  <input
                    required
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    value={repeat}
                    onChange={(e) => setRepeat(e.target.value)}
                    className={`${input} mt-2`}
                  />
                </label>
                <button
                  disabled={busy}
                  className="w-full rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Verificando…" : "Cambiar contraseña"}
                </button>
                <div className="flex flex-wrap justify-between gap-3 text-xs">
                  <button
                    type="button"
                    disabled={busy || now < resendAt}
                    onClick={() => void send(channel)}
                    className="font-semibold text-blue disabled:text-steel"
                  >
                    {now < resendAt
                      ? `Reenviar en ${Math.ceil((resendAt - now) / 1000)} s`
                      : "Reenviar código"}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setTicket(null);
                      setError(null);
                      setCode("");
                      setPassword("");
                      setRepeat("");
                    }}
                    className="font-semibold text-blue"
                  >
                    Cambiar canal
                  </button>
                </div>
              </form>
            )}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
