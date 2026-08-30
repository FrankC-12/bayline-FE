"use client";

import { Search, Plus } from "lucide-react";

interface FilialesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onCreateClick: () => void;
}

export default function FilialesToolbar({ search, onSearchChange, onCreateClick }: FilialesToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar filial"
          className="w-full rounded-xl border border-navy/15 bg-white py-2.5 pl-9 pr-4 text-sm text-ink outline-none transition focus:border-blue focus:ring-2 focus:ring-blue/20"
        />
      </div>
      <button
        onClick={onCreateClick}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy"
      >
        <Plus className="h-4 w-4" />
        Nueva filial
      </button>
    </div>
  );
}