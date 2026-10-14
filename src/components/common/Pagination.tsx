"use client";

export default function Pagination({page, pageSize, total, totalPages, setPage, setPageSize}: {
  page: number; pageSize: number; total: number; totalPages: number;
  setPage: (page: number) => void; setPageSize: (size: number) => void;
}) {
  return <nav aria-label="Paginación" className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-steel">
    <span>{total.toLocaleString("es-VE")} resultados · Página {page} de {totalPages}</span>
    <div className="flex items-center gap-2">
      <label>Por página<select aria-label="Resultados por página" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} className="ml-2 rounded-lg border border-navy/15 bg-white p-2"><option value={15}>15</option><option value={30}>30</option><option value={60}>60</option></select></label>
      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-full border border-navy/15 px-4 py-2 disabled:opacity-40">Anterior</button>
      <button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="rounded-full border border-navy/15 px-4 py-2 disabled:opacity-40">Siguiente</button>
    </div>
  </nav>;
}
