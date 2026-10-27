"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Aktivitas", href: "/aktivitas" },
  { label: "Tentang", href: "/tentang" },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[#DCEBF0] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0C3846] text-xl font-bold text-white">
            C
          </div>

          <span className="text-lg font-bold tracking-wide text-[#0C3846] sm:text-xl">
            CARAKA
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="flex items-center gap-4 text-sm font-medium sm:gap-8"
        >
          {navItems.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`transition-colors ${
                  active
                    ? "font-bold text-[#0C3846]"
                    : "text-[#65828B] hover:text-[#0C3846]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}