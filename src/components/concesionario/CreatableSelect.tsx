"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";

interface Props<T extends string | number> {
  label: string;
  value: T | "";
  options: T[];
  onChange: (value: T) => void;
  onAdd: (value: string) => void;
  required?: boolean;
  inputMode?: "text" | "numeric";
  canAdd?: boolean;
  /** Shown as a disabled, unselectable first option when `value` is "" —
   * so the field visibly starts empty instead of silently defaulting to
   * whatever the first real option happens to be. */
  placeholder?: string;
  error?: string;
}

export default function CreatableSelect<T extends string | number>({
  label,
  value,
  options,
  onChange,
  onAdd,
  required,
  inputMode = "text",
  canAdd = false,
  placeholder,
  error,
}: Props<T>) {
  const [adding, setAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  function save() {
    if (!newValue.trim()) return;
    onAdd(newValue.trim());
    setNewValue("");
    setAdding(false);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="block text-sm font-medium text-navy">{label}{required ? " *" : ""}</label>
        {canAdd && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex items-center gap-1 rounded-full border border-blue/25 px-2.5 py-1 text-xs font-semibold text-blue transition hover:bg-blue-light"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar {label.toLowerCase()}
          </button>
        )}
      </div>
      <select
        value={value}
        onChange={(event) => onChange((inputMode === "numeric" ? Number(event.target.value) : event.target.value) as T)}
        className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-blue ${
          error ? "border-red-400" : "border-navy/15"
        }`}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => <option key={String(option)} value={option}>{option}</option>)}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {adding && <div className="mt-2 flex gap-2">
        <input autoFocus inputMode={inputMode} value={newValue} onChange={(event) => setNewValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }} placeholder={`Nuevo ${label.toLowerCase()}`} className="min-w-0 flex-1 rounded-lg border border-blue/30 px-3 py-2 text-sm outline-none focus:border-blue" />
        <button type="button" onClick={save} className="rounded-lg bg-blue p-2 text-white"><Check className="h-4 w-4" /></button>
        <button type="button" onClick={() => { setAdding(false); setNewValue(""); }} className="rounded-lg border border-navy/15 p-2 text-steel"><X className="h-4 w-4" /></button>
      </div>}
    </div>
  );
}
