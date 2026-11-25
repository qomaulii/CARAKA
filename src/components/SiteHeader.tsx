
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Beranda", href: "/" },
  { label: "Aktivitas", href: "/aktivitas" },
  { label: "Tentang", href: "/tentang" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[#DCEBF0] bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <div className="flex min-h-[76px] items-center justify-between gap-4">
          <Link
            href="/"
            className="shrink-0"
            onClick={() => setMenuOpen(false)}
            aria-label="CAKARA, kembali ke beranda"
          >
            <Image
              src="/images/caraka-logo.png"
              alt="CAKARA"
              width={180}
              height={70}
              priority
              className="h-auto w-[132px] object-contain sm:w-[155px]"
            />
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-8 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-sm transition-colors ${
                  isActive(item.href)
                    ? "font-bold text-[#0C3846]"
                    : "font-medium text-[#65828B] hover:text-[#0C3846]"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:block">
            <Link
              href="/aktivitas"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
            >
              Mulai belajar
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#DCEBF0] text-[#0C3846] transition hover:bg-[#E4F4F8] md:hidden"
          >
            <i
              className={`bi ${menuOpen ? "bi-x-lg" : "bi-list"} text-xl`}
              aria-hidden="true"
            />
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Navigasi seluler"
            className="border-t border-[#DCEBF0] py-4 md:hidden"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm ${
                    isActive(item.href)
                      ? "bg-[#E4F4F8] font-bold text-[#0C3846]"
                      : "font-medium text-[#65828B] hover:bg-[#F7FBFC]"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/aktivitas"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-xl bg-[#0C3846] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Mulai belajar
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
