"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X, ChevronDown, LogOut, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { modules } from "./modules-data";
import NotificationInbox from "./NotificationInbox";
import { NAV_ITEMS as dealership } from "@/components/concesionario/nav-items";
import {
  NAV_ITEMS as workshop,
  ORDER_NAV_ITEMS,
} from "@/components/service-orders/nav-items";
import { NAV_ITEMS as parts } from "@/components/parts/nav-items";
import { NAV_ITEMS as warehouse } from "@/components/warehouse/nav-items";
import { COMPRAS_ITEMS } from "@/components/compras/nav-items";
import {
  ADMIN_ITEMS,
  FINANCE_ITEMS,
} from "@/components/administracion/nav-items";
import { getLatestExchangeRates } from "@/lib/api/concesionario";
import { apiFetch } from "@/lib/api/client";
import { switchHoldingContext } from "@/lib/api/auth";
const ShellContext = createContext(false);
export const useDashboardShell = () => useContext(ShellContext);
const groups = [
  { title: "Taller", ids: ["asesor-servicios", "clientes-vehiculos"] },
  { title: "Inventario", ids: ["repuestos", "almacen", "compras"] },
  { title: "Comercial", ids: ["concesionario", "ventas"] },
  { title: "Gestión", ids: ["administracion", "kpis"] },
  { title: "Sistema", ids: ["usuarios-accesos", "ajustes"] },
];
const childrenById: Record<string, { href: string; label: string }[]> = {
  "asesor-servicios": [
    ...ORDER_NAV_ITEMS,
    ...workshop.filter(
      (v) =>
        !["/dashboard/servicios", "/dashboard/servicios/historial"].includes(
          v.href,
        ),
    ),
  ],
  concesionario: dealership,
  repuestos: parts,
  almacen: warehouse,
  compras: COMPRAS_ITEMS,
  administracion: [...ADMIN_ITEMS, ...FINANCE_ITEMS],
};
export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { currentUser, hasModuleAccess, logout } = useAuth();
  const userId = currentUser?.userId;
  const [mobile, setMobile] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { label: string; type: string; href: string }[]
  >([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchError, setSearchError] = useState(false);
  useEffect(() => {
    let active = true;
    setResults([]);
    setSearchError(false);
    if (query.trim().length < 2) return;
    const timer = setTimeout(() => {
      apiFetch<{ label: string; type: string; href: string }[]>(
        `/dashboard/search?q=${encodeURIComponent(query.trim())}`,
        { toastOnError: false },
      )
        .then((v) => {
          if (active) setResults(v);
        })
        .catch(() => {
          if (active) setSearchError(true);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, currentUser?.filialId]);

  useEffect(() => {
    setMobile(false);
    setSearchOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!userId) return;
    void getLatestExchangeRates()
      .then((r) =>
        setRate(r.find((v) => v.currency === "USD")?.rate_ves ?? null),
      )
      .catch(() => undefined);
  }, [userId]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        search.current?.focus();
      }
      if (e.key === "Escape") {
        setMobile(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  async function exit(holding = false) {
    try {
      if (holding) {
        await switchHoldingContext(null);
        window.location.assign("/holding/entrada");
      } else {
        await logout();
        window.location.assign("/login");
      }
    } catch {
      setError("No se pudo completar la acción. Intenta de nuevo.");
    }
  }
  return (
    <ShellContext.Provider value={true}>
      <div className="motrix-workspace min-h-screen bg-ash text-ink">
        {mobile && (
          <button
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            aria-label="Cerrar navegación"
            onClick={() => setMobile(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[220px] flex-col bg-[#191919] px-3 text-white transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="flex items-center justify-between px-3 py-6">
            <Link
              href="/dashboard"
              className="font-display text-2xl font-bold tracking-tight"
            >
              motrix
            </Link>
            <button
              className="lg:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobile(false)}
            >
              <X size={18} />
            </button>
          </div>
          <div className="mb-4 flex gap-2 rounded-xl bg-white/5 p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue text-xs font-semibold">
              {(currentUser?.filialName || "SU").slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium">
                {currentUser?.filialName || "Mi sucursal"}
              </p>
              <p className="text-[10px] text-white/50">
                {currentUser?.holdingContext
                  ? "Acceso del holding"
                  : "Concesionario"}
              </p>
            </div>
          </div>
          <nav
            aria-label="Navegación principal"
            className="min-h-0 flex-1 overflow-y-auto pb-5 text-xs"
          >
            <Link
              href="/dashboard"
              aria-current={pathname === "/dashboard" ? "page" : undefined}
              className={`mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5 ${pathname === "/dashboard" ? "bg-blue text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              <Home size={14} />
              Inicio
            </Link>
            {groups.map((group) => {
              const visible = modules.filter(
                (m) =>
                  group.ids.includes(m.moduleId || "") &&
                  (!m.moduleId || hasModuleAccess(m.moduleId)),
              );
              if (!visible.length) return null;
              return (
                <section key={group.title} className="mb-4">
                  <p className="mb-2 px-3 text-[9px] uppercase tracking-[.18em] text-white/40">
                    {group.title}
                  </p>
                  {visible.map((m) => {
                    const id = m.moduleId!;
                    const items = childrenById[id];
                    const active =
                      !!m.href &&
                      (pathname === m.href ||
                        pathname.startsWith(m.href + "/"));
                    const expanded = open[id] ?? active;
                    const Icon = m.icon;
                    return (
                      <div key={id}>
                        {items ? (
                          <button
                            aria-expanded={expanded}
                            onClick={() =>
                              setOpen((s) => ({ ...s, [id]: !expanded }))
                            }
                            className={`flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left ${active ? "bg-blue text-white" : "text-white/70 hover:bg-white/5"}`}
                          >
                            <Icon size={14} />
                            <span className="flex-1">
                              {m.title === "KPIs" ? "Analíticas" : m.title}
                            </span>
                            <ChevronDown
                              size={12}
                              className={expanded ? "rotate-180" : ""}
                            />
                          </button>
                        ) : (
                          <Link
                            href={m.href || "/dashboard"}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2.5 ${active ? "bg-blue text-white" : "text-white/70 hover:bg-white/5"}`}
                          >
                            <Icon size={14} />
                            {id === "clientes-vehiculos" ? "Clientes" : m.title}
                          </Link>
                        )}
                        {items && expanded && (
                          <div className="ml-6 space-y-1 border-l border-white/10 py-1 pl-2">
                            {items.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                aria-current={
                                  pathname === item.href ? "page" : undefined
                                }
                                className={`block rounded-md px-2 py-2 text-[11px] ${pathname === item.href ? "bg-white/10 text-white" : "text-white/60 hover:text-white"}`}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </section>
              );
            })}
          </nav>
          <div className="border-t border-white/10 py-4">
            {currentUser?.holdingContext && (
              <button
                onClick={() => void exit(true)}
                className="mb-3 w-full rounded-lg border border-white/20 p-2 text-xs"
              >
                Volver al holding
              </button>
            )}
            <div className="flex items-center gap-2 px-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue/60 text-xs">
                {currentUser?.fullName?.slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs">{currentUser?.fullName}</p>
                <p className="truncate text-[10px] text-white/40">
                  {currentUser?.roleSlug}
                </p>
              </div>
              <button
                aria-label="Cerrar sesión"
                onClick={() => void exit()}
                className="p-1 text-white/60 hover:text-white"
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </aside>
        <div className="min-w-0 lg:pl-[220px]">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-black/5 bg-ash/95 px-4 backdrop-blur lg:px-7">
            <button
              onClick={() => setMobile(true)}
              aria-label="Abrir menú"
              className="lg:hidden"
            >
              <Menu size={20} />
            </button>
            <form
              className="relative w-full max-w-sm"
              action="/dashboard/clientes"
            >
              <Search size={14} className="absolute left-3 top-3 text-steel" />
              <input
                ref={search}
                name="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                maxLength={80}
                placeholder="Buscar ODS, placa, VIN, cliente…"
                aria-label="Buscar ODS, vehículos y clientes"
                aria-controls="global-search-results"
                className="w-full rounded-lg border border-black/10 bg-white py-2.5 pl-9 pr-12 text-xs outline-none focus:border-blue"
              />
              <kbd className="absolute right-3 top-3 text-[10px] text-steel">
                ⌘K
              </kbd>
              {searchOpen && query.trim().length >= 2 && (
                <div
                  id="global-search-results"
                  className="absolute left-0 right-0 top-full mt-2 max-h-80 overflow-y-auto rounded-xl border border-navy/10 bg-white p-2 shadow-xl"
                >
                  {results.map((item) => (
                    <Link
                      key={item.href + item.label}
                      href={item.href}
                      onClick={() => setSearchOpen(false)}
                      className="block rounded-lg p-3 text-xs hover:bg-blue-light"
                    >
                      <span className="block text-[9px] uppercase tracking-widest text-steel">
                        {item.type}
                      </span>
                      <span className="mt-1 block font-semibold">
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  {!results.length && (
                    <p role="status" className="p-3 text-xs text-steel">
                      {searchError
                        ? "No se pudo realizar la búsqueda."
                        : "Sin resultados disponibles."}
                    </p>
                  )}
                </div>
              )}
            </form>
            <div className="ml-auto hidden rounded-full border border-black/5 bg-white px-3 py-2 text-[10px] sm:block">
              <span className="mr-2 text-emerald-500">●</span>Tasa BCV{" "}
              <strong>
                {rate == null
                  ? "No disponible"
                  : `Bs ${rate.toLocaleString("es-VE", { maximumFractionDigits: 2 })}`}
              </strong>
            </div>
            {currentUser && <NotificationInbox />}
          </header>
          {error && (
            <p role="alert" className="bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="motrix-content mx-auto w-full max-w-[1800px] px-4 py-7 lg:px-7">
            {children}
          </div>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
