"use client";

import { useEffect, useState } from "react";

interface GaugeDialProps {
  value: number; // 0-100
  label: string;
  suffix?: string;
}

const SIZE = 120;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function GaugeDial({ value, label, suffix = "" }: GaugeDialProps) {
  const [filled, setFilled] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setFilled(value), 250);
    return () => clearTimeout(t);
  }, [value]);

  const offset = CIRCUMFERENCE - (filled / 100) * CIRCUMFERENCE;

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="#26365A" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#E8A33D"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-[1400ms] ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-xl font-bold text-white">
          {Math.round(filled)}
          {suffix}
        </span>
        <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}