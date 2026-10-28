"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ArrowRight, Globe2, Search, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listFiliales } from "@/lib/api/filiales";
import { switchHoldingContext } from "@/lib/api/auth";
import type { Filial } from "@/types/filial";
export default function HoldingEntryView() {
  const { currentUser } = useAuth();
  const [filiales, setFiliales] = useState<Filial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    if (!currentUser?.holdingId) {
      setLoading(false);
      return;
    }
    listFiliales(currentUser.holdingId)
      .then((data) => {
        if (active) setFiliales(data);
      })
      .catch((err) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las filiales.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentUser?.holdingId, reload]);
  async function enter(filial: Filial) {
    if (busy || !filial.is_active) return;
    setBusy(filial.id);
    setError(null);
    try {
      await switchHoldingContext(filial.id);
      window.location.assign("/dashboard");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo entrar a la filial.",
      );
      setBusy(null);
    }
  }
  const visible = filiales.filter((f) =>
    `${f.name} ${f.legal_name ?? ""} ${f.rif ?? ""}`
      .toLocaleLowerCase()
      .includes(search.toLocaleLowerCase()),
  );
  return (
    <div className="space-y-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-blue">
          Acceso del holding
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-navy">
          ¿Dónde quieres trabajar?
        </h1>
        <p className="mt-2 text-sm text-steel">
          Consulta todo el grupo o administra una filial con tu cuenta del
          holding.
        </p>
      </header>
      <Link
        href="/holding"
        aria-disabled={!!busy}
        onClick={(event) => {
          if (busy) event.preventDefault();
        }}
        className="flex items-center gap-4 rounded-2xl border border-blue/20 bg-blue-light/60 p-6 transition hover:border-blue"
      >
        <span className="rounded-2xl bg-white p-3 text-blue">
          <Globe2 aria-hidden="true" className="h-7 w-7" />
        </span>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold text-navy">
            Vista general del holding
          </h2>
          <p className="mt-1 text-sm text-steel">
            Indicadores consolidados y seguimiento de todas las filiales.
          </p>
        </div>
        <ArrowRight aria-hidden="true" className="h-5 w-5 text-blue" />
      </Link>
      <section>
        <h2 className="font-display text-xl font-bold text-navy">
          Administrar una filial
        </h2>
        <p className="mt-1 text-sm text-steel">
          Accede a almacenes, taller, ventas, finanzas, usuarios y permisos de
          la filial seleccionada.
        </p>
        <div className="relative my-4">
          <Search
            aria-hidden="true"
            className="absolute left-4 top-3.5 h-4 w-4 text-steel"
          />
          <input
            aria-label="Buscar filial"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RIF…"
            className="w-full rounded-xl border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm"
          />
        </div>
        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
            <button
              onClick={() => setReload((value) => value + 1)}
              className="ml-3 underline"
            >
              Reintentar
            </button>
          </div>
        )}
        {loading ? (
          <p role="status" className="py-10 text-center text-sm text-steel">
            Cargando filiales…
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {visible.map((filial) => (
              <article
                key={filial.id}
                className="flex min-w-0 flex-col rounded-2xl border border-navy/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Building2
                    aria-hidden="true"
                    className="h-8 w-8 shrink-0 rounded-lg bg-blue-light p-1.5 text-blue"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="break-words font-display text-lg font-bold text-navy">
                      {filial.name}
                    </h3>
                    <p className="mt-1 font-mono text-xs text-steel">
                      {filial.rif || filial.slug}
                    </p>
                  </div>
                  {!filial.is_active && (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-steel">
                      Inactiva
                    </span>
                  )}
                </div>
                <p className="mt-4 flex-1 text-sm text-steel">
                  {filial.legal_name || "Gestión completa de la filial"}
                </p>
                <button
                  disabled={!!busy || !filial.is_active}
                  onClick={() => void enter(filial)}
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-blue px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy === filial.id ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  )}
                  {busy === filial.id ? "Entrando…" : "Entrar a la filial"}
                </button>
              </article>
            ))}
          </div>
        )}
        {!loading && !error && !visible.length && (
          <p className="rounded-xl border border-dashed border-navy/15 bg-white p-8 text-center text-sm text-steel">
            {search
              ? "No hay filiales que coincidan con tu búsqueda."
              : "Este holding todavía no tiene filiales registradas."}
          </p>
        )}
      </section>
    </div>
  );
}
