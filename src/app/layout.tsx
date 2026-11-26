
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CARAKA | Ruang Belajar Kreatif",
    template: "%s | CARAKA",
  },
  description:
    "Platform pembelajaran adaptif untuk mengembangkan pengetahuan, kreativitas, dan ekspresi siswa sekolah dasar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
