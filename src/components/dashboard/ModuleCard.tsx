import Link from "next/link";
import type { ModuleCardData } from "./modules-data";

export default function ModuleCard({ icon: Icon, title, description, badge, tint, href }: ModuleCardData) {
  const content = (
    <>
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-5 font-display text-lg font-bold text-navy">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-steel">{description}</p>
      <span className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-widest text-blue">
        {badge}
      </span>
    </>
  );

  const baseClassName =
    "group flex flex-col items-start rounded-2xl border border-navy/10 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md";

  if (href) {
    return (
      <Link href={href} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled
      className={`${baseClassName} cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-sm`}
    >
      {content}
    </button>
  );
}