import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Tentang CARAKA",
  description:
    "Pelajari tujuan, pendekatan, dan teknologi yang dirancang untuk CARAKA.",
};

const principles = [
  {
    icon: "bi-book",
    title: "Knowledge",
    description:
      "Mendorong siswa memahami informasi, menjawab pertanyaan, dan melatih kemampuan berpikir.",
  },
  {
    icon: "bi-palette",
    title: "Creativity",
    description:
      "Memberikan stimulus visual untuk membantu siswa mengembangkan ide dan menghasilkan karya.",
  },
  {
    icon: "bi-chat-square-text",
    title: "Self-Expression",
    description:
      "Mendukung siswa menyampaikan pendapat, mengembangkan gagasan, dan melatih kemampuan berbicara.",
  },
];

export default function TentangPage() {
  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-bold tracking-wide text-[#2A7387]">
            TENTANG CARAKA
          </p>

          <h1 className="mt-3 text-3xl leading-tight font-bold text-[#0C3846] sm:text-4xl lg:text-5xl">
            Ruang untuk belajar, berkarya, dan berekspresi.
          </h1>

          <p className="mt-5 text-base leading-7 text-[#65828B] sm:text-lg">
            CARAKA merupakan platform pembelajaran berbasis web yang dirancang
            untuk mendukung pengembangan pengetahuan, kreativitas, dan
            kemampuan berekspresi siswa sekolah dasar, khususnya kelas 4–6.
          </p>
        </div>

        {/* Tujuan */}
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl bg-[#0C3846] p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <i
                className="bi bi-bullseye text-2xl text-[#9FD3E3]"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              Tujuan
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#D4EAF0] sm:text-base">
              Mendukung proses belajar yang memberi ruang bagi siswa untuk
              berpikir kritis, mengembangkan kreativitas, dan menyampaikan
              gagasan secara lisan.
            </p>
          </article>

          <article className="rounded-3xl border border-[#DCEBF0] bg-white p-7 sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F4F8]">
              <i
                className="bi bi-signpost-split text-2xl text-[#2A7387]"
                aria-hidden="true"
              />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-[#0C3846]">
              Pendekatan
            </h2>

            <p className="mt-3 text-sm leading-7 text-[#65828B] sm:text-base">
              Aktivitas dirancang dengan stimulus, pertanyaan, dan tantangan
              yang dapat dikembangkan sesuai kebutuhan serta perkembangan
              belajar siswa.
            </p>
          </article>
        </div>

        {/* Tiga aspek */}
        <section className="mt-14">
          <p className="text-sm font-bold tracking-wide text-[#2A7387]">
            TIGA ASPEK PEMBELAJARAN
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0C3846] sm:text-3xl">
            Apa yang dikembangkan?
          </h2>

          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <article
                key={principle.title}
                className="rounded-3xl border border-[#DCEBF0] bg-white p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E4F4F8]">
                  <i
                    className={`bi ${principle.icon} text-2xl text-[#2A7387]`}
                    aria-hidden="true"
                  />
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#0C3846]">
                  {principle.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#65828B]">
                  {principle.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* Teknologi */}
        <section className="mt-14 rounded-3xl bg-[#E4F4F8] p-7 sm:p-9">
          <p className="text-sm font-bold tracking-wide text-[#2A7387]">
            PENGEMBANGAN PLATFORM
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0C3846] sm:text-3xl">
            Teknologi yang digunakan
          </h2>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#496C77] sm:text-base">
            CARAKA dikembangkan menggunakan Next.js, TypeScript, dan Tailwind
            CSS. Platform ini dirancang untuk dikembangkan lebih lanjut
            melalui integrasi Computer Vision, Speech-to-Text, dan mekanisme
            pembelajaran adaptif.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {["Next.js", "TypeScript", "Tailwind CSS", "Computer Vision", "Speech-to-Text"].map(
              (technology) => (
                <span
                  key={technology}
                  className="rounded-full border border-[#C5E2EA] bg-white px-4 py-2 text-sm font-medium text-[#0C3846]"
                >
                  {technology}
                </span>
              ),
            )}
          </div>

          <p className="mt-5 text-xs leading-5 text-[#65828B]">
            Catatan: integrasi Computer Vision, Speech-to-Text, dan mekanisme
            adaptif merupakan rencana pengembangan, bukan fitur yang otomatis
            tersedia pada versi ini.
          </p>
        </section>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-[#0C3846]">
            Siap mencoba aktivitas CARAKA?
          </h2>

          <p className="mt-3 text-sm text-[#65828B]">
            Mulai dengan aktivitas yang menarik perhatianmu.
          </p>

          <Link
            href="/aktivitas"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
          >
            Jelajahi aktivitas
            <i className="bi bi-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © {new Date().getFullYear()} CARAKA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}