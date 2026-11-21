"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Preguntar" },
  { href: "/resultados", label: "Resultados del eval" },
] as const;

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Secciones" className="flex gap-1 self-stretch">
      {LINKS.map(({ href, label }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center border-b-2 px-2 text-sm sm:px-3 sm:text-base ${
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
