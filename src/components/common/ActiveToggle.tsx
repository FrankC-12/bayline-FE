interface ActiveToggleProps {
  isActive: boolean;
  disabled: boolean;
  onToggle: () => void;
  label: string;
}

/** Shared activate/deactivate switch for catalog entries (brands, models,
 * part categories, part measures...) — nothing in these catalogs is ever
 * hard-deleted, only toggled inactive. */
export default function ActiveToggle({ isActive, disabled, onToggle, label }: ActiveToggleProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${
        isActive ? "bg-emerald-500" : "bg-navy/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          isActive ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}
