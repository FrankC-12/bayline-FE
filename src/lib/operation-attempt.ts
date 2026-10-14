import { createRequestId } from "./request-id";

/** Retain the ID after failures; editing the operation creates a new ID. */
export function createOperationAttempt(generateId: () => string = createRequestId) {
  let current: { fingerprint: string; requestId: string } | null = null;
  return {
    reset() { current = null; },
    idFor(payload: unknown): string {
      const fingerprint = JSON.stringify(payload);
      if (!current || current.fingerprint !== fingerprint) {
        current = { fingerprint, requestId: generateId() };
      }
      return current.requestId;
    },
  };
}
