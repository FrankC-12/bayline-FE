"use client";

import { useLayoutEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { displayNumberInput, parseNumberInput } from "@/lib/numberInput";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange" | "defaultValue"> & {
  value: string | number;
  onValueChange: (value: string) => void;
};

/** Localized display; consumers always receive an ungrouped dot-decimal value. */
export function NumberInput({ value, onValueChange, step, min, max, inputMode, onKeyDown, onBlur, onPaste, ...props }: Props) {
  const decimals = step === "any" ? 12 : step !== undefined
    ? (String(step).split(".")[1]?.length ?? 0)
    : inputMode === "decimal" ? 2 : 0;
  const input = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const raw = draft !== null && (draft === String(value) || Number(draft) === Number(value)) ? draft : String(value);
  const displayed = displayNumberInput(raw);

  useLayoutEffect(() => {
    const el = input.current;
    if (!el) return;
    const number = Number(raw);
    const invalid = raw !== "" && (!Number.isFinite(number) || raw === "-" ||
      (min !== undefined && number < Number(min)) || (max !== undefined && number > Number(max)));
    el.setCustomValidity(invalid ? `Introduce un valor válido${min !== undefined ? `, mínimo ${min}` : ""}${max !== undefined ? `, máximo ${max}` : ""}.` : "");
    if (caret.current !== null) {
      let remaining = caret.current;
      let position = 0;
      while (position < displayed.length && remaining > 0) {
        if (displayed[position] !== ".") remaining--;
        position++;
      }
      el.setSelectionRange(position, position);
      caret.current = null;
    }
  });

  function update(text: string, position: number) {
    const next = parseNumberInput(text.replace(/\./g, ""), decimals, true);
    caret.current = text.slice(0, position).replace(/\./g, "").length;
    setDraft(next);
    onValueChange(next);
  }

  return <input {...props} ref={input} type="text" inputMode={decimals ? "decimal" : "numeric"}
    value={displayed}
    onChange={(event) => {
      const position = event.target.selectionStart ?? event.target.value.length;
      let text = event.target.value;
      // Mobile keyboards may insert a decimal dot without a keydown event.
      if (decimals && (event.nativeEvent as InputEvent).data === ".") {
        text = text.slice(0, position - 1) + "," + text.slice(position);
      }
      update(text, position);
    }}
    onPaste={(event) => {
      onPaste?.(event);
      if (event.defaultPrevented) return;
      event.preventDefault();
      const pasted = displayNumberInput(parseNumberInput(event.clipboardData.getData("text"), decimals, true));
      const start = event.currentTarget.selectionStart ?? displayed.length;
      const end = event.currentTarget.selectionEnd ?? start;
      update(displayed.slice(0, start) + pasted + displayed.slice(end), start + pasted.length);
    }}
    onKeyDown={(event) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      const el = event.currentTarget;
      const start = el.selectionStart ?? displayed.length;
      const end = el.selectionEnd ?? start;
      if (start === end && event.key === "Backspace" && displayed[start - 1] === ".") {
        event.preventDefault();
        update(displayed.slice(0, start - 2) + displayed.slice(start), start - 2);
        return;
      }
      if (start === end && event.key === "Delete" && displayed[start] === ".") {
        event.preventDefault();
        update(displayed.slice(0, start) + displayed.slice(start + 2), start);
        return;
      }
      // A keyboard decimal dot is a comma; dots in pasted text can be grouping separators.
      if (event.key === "." && decimals) {
        event.preventDefault();
        const el = event.currentTarget;
        const start = el.selectionStart ?? displayed.length;
        const end = el.selectionEnd ?? start;
        if (!(displayed.slice(0, start) + displayed.slice(end)).includes(",")) {
          update(displayed.slice(0, start) + "," + displayed.slice(end), start + 1);
        }
      }
    }}
    onBlur={(event) => { setDraft(null); onBlur?.(event); }} />;
}
