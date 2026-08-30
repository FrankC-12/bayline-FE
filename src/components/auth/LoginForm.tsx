"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api/client";
import type { RoleScope } from "@/types/auth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const LANDING_BY_SCOPE: Record<RoleScope, string> = {
  platform: "/platform/holdings",
  holding: "/holding/filiales",
  filial: "/dashboard",
};

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Completa tu correo y contraseña.");
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setError("Ingresa un correo electrónico válido (ej: nombre@empresa.com).");
      return;
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      router.push(LANDING_BY_SCOPE[user.scope]);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.errorCode === "invalid_credentials") {
          setError("Correo o contraseña incorrectos.");
        } else if (err.errorCode === "inactive_user") {
          setError("Esta cuenta no está activa. Contacta a tu administrador.");
        } else {
          setError(err.message);
        }
      } else {
        setError("No pudimos iniciar sesión. Verifica tu conexión e intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-6 py-16 lg:px-20">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-steel hover:text-navy lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al inicio
      </Link>

      <div className="mx-auto w-full max-w-sm">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-blue">
          Acceso a la plataforma
        </span>
        <h2 className="mt-3 font-display text-3xl font-bold text-navy">Iniciar sesión</h2>
        <p className="mt-2 text-sm text-steel">
          Ingresa con tu cuenta para ver los módulos de tu holding.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-navy">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@empresa.com"
              className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-navy">
                Contraseña
              </label>
              <Link href="/recuperar-password" className="text-xs font-medium text-blue hover:text-navy">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 pr-11 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
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
          </div>

          <label className="flex items-center gap-2 text-sm text-steel">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-navy/20 text-blue focus:ring-blue/30"
            />
            Mantener sesión iniciada
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue px-6 py-3 font-semibold text-white transition hover:bg-navy disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingresando...
              </>
            ) : (
              "Iniciar sesión"
            )}
          </button>
        </form>

        <Link
          href="/"
          className="mt-8 hidden items-center gap-2 text-sm font-medium text-steel hover:text-navy lg:inline-flex"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}