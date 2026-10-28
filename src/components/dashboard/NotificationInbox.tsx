"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api/client";
interface Notice {
  id: string;
  title: string;
  body: string;
  read_at: string | null;
  data: Record<string, string>;
}
export default function NotificationInbox() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (!currentUser) return;
    try {
      setItems(await apiFetch<Notice[]>("/notifications?limit=50"));
      setError("");
    } catch {
      setError("No se pudieron cargar los avisos.");
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  useEffect(() => {
    setItems([]);
    setLoading(true);
    void refresh();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 30000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  useEffect(() => {
    if (!open) return;
    function outside(event: MouseEvent) {
      if (
        container.current &&
        !container.current.contains(event.target as Node)
      )
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  async function visit(item: Notice) {
    try {
      await apiFetch(`/notifications/${item.id}/read`, { method: "PATCH" });
      setItems((previous) =>
        previous.map((row) =>
          row.id === item.id
            ? { ...row, read_at: new Date().toISOString() }
            : row,
        ),
      );
      const href =
        item.data.href ??
        (item.data.service_order_id
          ? `/dashboard/servicios/${encodeURIComponent(item.data.service_order_id)}`
          : "");
      if (href.startsWith("/dashboard/") && !href.includes("\\")) {
        setOpen(false);
        router.push(href);
      }
    } catch {
      setError("No se pudo abrir el aviso. Intenta nuevamente.");
    }
  }
  const unread = items.filter((item) => !item.read_at).length;
  return (
    <div className="relative" ref={container}>
      <button
        type="button"
        aria-label={`Notificaciones${unread ? `: ${unread} sin leer` : ""}`}
        aria-expanded={open}
        onClick={() => {
          setOpen((value) => !value);
          void refresh();
        }}
        className="relative rounded-lg p-1 text-slate-300 transition hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <section
          aria-label="Notificaciones"
          className="absolute right-0 top-10 z-[80] w-[min(24rem,85vw)] overflow-hidden rounded-2xl border border-navy/10 bg-white text-navy shadow-xl"
        >
          <div className="flex items-center justify-between border-b p-4">
            <h2 className="font-semibold">Notificaciones</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-steel"
            >
              Cerrar
            </button>
          </div>
          {error && (
            <p role="alert" className="p-3 text-xs text-red-700">
              {error}{" "}
              <button onClick={() => void refresh()} className="underline">
                Reintentar
              </button>
            </p>
          )}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="p-5 text-sm text-steel">Cargando avisos…</p>
            ) : !items.length ? (
              <p className="p-5 text-sm text-steel">
                No tienes notificaciones.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => void visit(item)}
                  className={`block w-full border-b p-4 text-left last:border-0 hover:bg-slate-50 ${!item.read_at ? "bg-blue-light/40" : ""}`}
                >
                  <p className="text-sm font-semibold">
                    {!item.read_at && (
                      <span
                        aria-label="Sin leer"
                        className="mr-2 inline-block h-2 w-2 rounded-full bg-blue"
                      />
                    )}
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-steel">
                    {item.body}
                  </p>
                </button>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
