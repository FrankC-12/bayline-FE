/** Pulsing red dot signaling that a nearby value is ticking live (updates on
 * its own, without a refresh) — e.g. next to an elapsed-time clock for an
 * order that's still open. */
export default function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" role="status" aria-label="En vivo">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
    </span>
  );
}
