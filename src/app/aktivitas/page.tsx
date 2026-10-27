import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import ActivityCard from "@/components/ActivityCard";
import { activities } from "@/data/activities";

export const metadata: Metadata = {
  title: "Aktivitas",
  description:
    "Jelajahi aktivitas Knowledge, Creativity, dan Self-Expression di CARAKA.",
};

export default function AktivitasPage() {
  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-bold tracking-wide text-[#2A7387]">
            RUANG BELAJAR
          </p>

          <h1 className="mt-3 text-3xl leading-tight font-bold text-[#0C3846] sm:text-4xl lg:text-5xl">
            Mau belajar apa hari ini?
          </h1>

          <p className="mt-4 text-base leading-7 text-[#65828B]">
            Pilih aktivitas yang ingin kamu coba. Setiap kegiatan membantumu
            mengembangkan kemampuan dengan cara yang berbeda.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <div key={activity.id} id={activity.id} className="scroll-mt-28">
              <ActivityCard activity={activity} />
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-3xl border border-[#DCEBF0] bg-white p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E4F4F8]">
              <i
                className="bi bi-info-circle text-2xl text-[#2A7387]"
                aria-hidden="true"
              />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#0C3846]">
                Belajar dengan caramu sendiri
              </h2>

              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                CARAKA dirancang untuk mendukung proses belajar yang
                menyesuaikan kebutuhan dan perkembangan siswa. Setiap
                aktivitas menjadi kesempatan untuk mencoba, berpikir, dan
                menyampaikan ide.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © {new Date().getFullYear()} CARAKA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}