"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";


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
            <div className="flex items-center">
                <Image
                    src="/images/caraka-logo.png"
                    alt="CARAKA"
                    width={180}
                    height={70}
                    priority
                    className="h-auto w-[140px] object-contain sm:w-[160px]"
                />
            </div>
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