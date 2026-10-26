"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
const modalStack: HTMLElement[] = [];
let initialOverflow = "";
const WIDTHS = { md: "max-w-xl", lg: "max-w-3xl", xl: "max-w-4xl" };
interface ModalProps {
  stableHeight?: boolean;
  placement?: "center" | "right";
  size?: keyof typeof WIDTHS;
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeDisabled?: boolean;
  interactionPaused?: boolean;
}
/** Shared dialog with fixed header/actions and scrollable content. */
export default function Modal({
  placement = "center",
  stableHeight = false,
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeDisabled = false,
  interactionPaused = false,
  size = "xl",
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLElement>(null);
  const latest = useRef({ onClose, closeDisabled, interactionPaused });
  latest.current = { onClose, closeDisabled, interactionPaused };
  useEffect(() => {
    if (!open) return;
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const currentPanel = panel.current;
    if (!currentPanel) return;
    if (!modalStack.length) initialOverflow = document.body.style.overflow;
    modalStack.push(currentPanel);
    document.body.style.overflow = "hidden";
    const controls = () =>
      Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        ) ?? [],
      ).filter((el) => el.getClientRects().length > 0);
    panel.current?.focus();
    function keyboard(event: KeyboardEvent) {
      if (
        latest.current.interactionPaused ||
        modalStack[modalStack.length - 1] !== currentPanel
      )
        return;
      // Preserve independently managed nested dialogs (for example damage/photo editors).
      if (
        Array.from(
          currentPanel.querySelectorAll<HTMLElement>(".fixed.inset-0"),
        ).some((layer) => layer.getClientRects().length > 0)
      )
        return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        if (!latest.current.closeDisabled) latest.current.onClose();
      }
      if (event.key !== "Tab") return;
      const items = controls();
      const first = items[0];
      const last = items[items.length - 1];
      if (!first) {
        event.preventDefault();
        panel.current?.focus();
        return;
      }
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panel.current?.contains(document.activeElement) ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panel.current?.contains(document.activeElement) ||
          document.activeElement === panel.current)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.removeEventListener("keydown", keyboard);
      const wasTop = modalStack[modalStack.length - 1] === currentPanel;
      const index = modalStack.indexOf(currentPanel);
      if (index >= 0) modalStack.splice(index, 1);
      if (!modalStack.length) document.body.style.overflow = initialOverflow;
      if (wasTop && previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className={`fixed inset-0 z-50 flex bg-navy/40 ${placement === "right" ? "items-stretch justify-end" : "items-center justify-center p-3 sm:p-6"}`}
      onClick={(event) => {
        if (
          event.target === event.currentTarget &&
          !closeDisabled &&
          !interactionPaused
        )
          onClose();
      }}
    >
      <section
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`flex w-full ${WIDTHS[size]} flex-col overflow-hidden border border-navy/10 bg-white shadow-2xl outline-none ${placement === "right" ? "h-dvh" : `${stableHeight ? "h-[92dvh]" : ""} max-h-[92dvh] rounded-2xl`}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-navy/10 px-5 py-5 sm:px-7">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="font-display text-xl font-bold text-navy"
            >
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-steel">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            disabled={closeDisabled}
            onClick={onClose}
            className="shrink-0 rounded-xl p-2 text-steel hover:bg-ash disabled:opacity-50"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div
          className={`min-h-0 overflow-y-auto overscroll-contain ${stableHeight ? "flex-1" : ""}`}
        >
          {children}
        </div>
        {footer && (
          <footer className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-navy/10 bg-white px-5 py-4 sm:px-7">
            {footer}
          </footer>
        )}
      </section>
    </div>
  );
}
