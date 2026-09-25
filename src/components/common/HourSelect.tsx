"use client";

// Matches CalendarView's HOURS (08:00–18:00) — the default whenever a caller
// doesn't already have its own business-hours window to pass in.
const DEFAULT_HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);

interface HourSelectProps {
  value: string;
  onChange: (value: string) => void;
  hours?: number[];
  disabled?: boolean;
  className?: string;
}

/** A time-of-day picker in 30-minute blocks — one <optgroup> per hour, same
 * pattern used across every "Hora" field in the app. */
export default function HourSelect({ value, onChange, hours = DEFAULT_HOURS, disabled, className }: HourSelectProps) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={
        className ??
        "w-full rounded-xl border border-navy/15 px-4 py-2.5 text-sm outline-none focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:bg-ash disabled:text-steel"
      }
    >
      <option value="">Selecciona...</option>
      {hours.map((h) => (
        <optgroup key={h} label={`${h.toString().padStart(2, "0")}:00`}>
          {["00", "30"].map((m) => {
            const v = `${h.toString().padStart(2, "0")}:${m}`;
            return (
              <option key={v} value={v}>
                {v}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}
