interface EmptyStateProps {
  title: string;
  description?: string;
  /** Single-line style used inside tables/lists, instead of the bordered card. */
  compact?: boolean;
}

/** Shared "no items" state for lists — used both when a dataset is genuinely
 * empty and when a search/filter matched nothing, so every list in the app
 * says so explicitly instead of just rendering nothing. */
export default function EmptyState({ title, description, compact }: EmptyStateProps) {
  if (compact) {
    return <div className="p-12 text-center text-sm text-steel">{title}</div>;
  }
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-12 text-center">
      <p className="font-display text-lg font-bold text-navy">{title}</p>
      {description && <p className="mt-1 text-sm text-steel">{description}</p>}
    </div>
  );
}
