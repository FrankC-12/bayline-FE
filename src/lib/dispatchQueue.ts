/** Keep the operator’s queue position while publishing authoritative server values. */
export function reconcileDispatchQueue<T extends { id: string }>(
  previous: T[],
  incoming: T[],
): T[] {
  const remaining = new Map(incoming.map((item) => [item.id, item]));
  const result: T[] = [];
  for (const item of previous) {
    const fresh = remaining.get(item.id);
    if (fresh) {
      result.push(fresh);
      remaining.delete(item.id);
    }
  }
  return [...result, ...Array.from(remaining.values())];
}
