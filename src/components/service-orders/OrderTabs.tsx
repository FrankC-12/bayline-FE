"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ORDER_NAV_ITEMS } from "./nav-items";
export default function OrderTabs() {
  const path = usePathname();
  return (
    <nav
      aria-label="Bandejas de órdenes de servicio"
      className="mb-6 flex flex-wrap gap-1 rounded-2xl border border-navy/10 bg-white p-1.5"
    >
      {ORDER_NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={path === item.href ? "page" : undefined}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${path === item.href ? "bg-blue-light text-blue" : "text-steel hover:bg-ash hover:text-navy"}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
