"use client";

import { Search, Plus } from "lucide-react";

interface ClientsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export default function ClientsToolbar({ search, onSearchChange, onCreateClick }: ClientsToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nombre, cédula/RIF, placa o VIN..."
          className="w-full rounded-full border border-navy/15 bg-white py-3 pl-11 pr-4 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>
      <button
        onClick={onCreateClick}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-navy"
      >
        <Plus className="h-4 w-4" />
        Nuevo cliente
      </button>
    </div>
  );
}