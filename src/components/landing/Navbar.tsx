"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "#modulos", label: "Módulos" },
  { href: "#", label: "Producto" },
  { href: "#", label: "Precios" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-navy/10 bg-ash/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <span className="font-display text-xl font-bold text-navy">Bayline</span>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-sm font-medium text-steel hover:text-navy">
              {l.label}
            </a>
          ))}
          <Link
            href="/login"
            className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue"
          >
            Iniciar sesión
          </Link>
        </nav>

        <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú">
          {open ? <X className="h-6 w-6 text-navy" /> : <Menu className="h-6 w-6 text-navy" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-navy/10 bg-ash px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-sm font-medium text-steel">
                {l.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-full bg-navy px-5 py-2 text-center text-sm font-semibold text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}