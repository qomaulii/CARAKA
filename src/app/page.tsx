import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ActivityCard from "@/components/ActivityCard";
import { activities } from "@/data/activities";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      {/* Hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-2 lg:px-10 lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#E4F4F8] px-4 py-2 text-sm font-semibold text-[#2A7387]">
            <i className="bi bi-stars" aria-hidden="true" />
            Ruang belajar kreatif
          </span>

          <h1 className="mt-6 max-w-xl text-4xl leading-tight font-bold tracking-tight text-[#0C3846] sm:text-5xl lg:text-6xl">
            Setiap ide punya cerita.
          </h1>

          <p className="mt-5 max-w-lg text-base leading-7 text-[#65828B] sm:text-lg">
            Belajar, berkreasi, dan berani menyampaikan pendapat melalui
            aktivitas yang menyenangkan.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/aktivitas"
              className="inline-flex items-center gap-3 rounded-xl bg-[#0C3846] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
            >
              Mulai belajar
              <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>

            <Link
              href="/tentang"
              className="inline-flex items-center gap-2 rounded-xl border border-[#DCEBF0] bg-white px-6 py-3.5 text-sm font-semibold text-[#0C3846] transition hover:border-[#9FD3E3]"
            >
              Kenali CARAKA
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#65828B]">
            <span className="flex items-center gap-2">
              <i className="bi bi-lightbulb text-[#2A7387]" aria-hidden="true" />
              Berpikir
            </span>

            <span className="flex items-center gap-2">
              <i className="bi bi-palette text-[#94651B]" aria-hidden="true" />
              Berkreasi
            </span>

            <span className="flex items-center gap-2">
              <i
                className="bi bi-chat-square-text text-[#2A7387]"
                aria-hidden="true"
              />
              Bercerita
            </span>
          </div>
        </div>

        {/* Ilustrasi */}
        <div className="relative mx-auto w-full max-w-lg">
          <div className="absolute inset-8 rounded-full bg-[#E4F4F8]" />

          <div className="relative grid grid-cols-2 gap-4 p-4 sm:gap-5 sm:p-8">
            <div className="flex min-h-44 flex-col items-center justify-center rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#DCEBF0] sm:min-h-52">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E4F4F8]">
                <i
                  className="bi bi-lightbulb text-4xl text-[#2A7387]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-bold text-[#0C3846]">Pikirkan</p>
              <p className="mt-1 text-center text-sm text-[#65828B]">
                Temukan jawaban
              </p>
            </div>

            <div className="mt-10 flex min-h-44 flex-col items-center justify-center rounded-[2rem] bg-[#FFF3D9] p-5 sm:mt-12 sm:min-h-52">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                <i
                  className="bi bi-palette text-4xl text-[#94651B]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-bold text-[#0C3846]">Ciptakan</p>
              <p className="mt-1 text-center text-sm text-[#65828B]">
                Kembangkan ide
              </p>
            </div>

            <div className="flex min-h-44 flex-col items-center justify-center rounded-[2rem] bg-[#DFF1F6] p-5 sm:min-h-52">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                <i
                  className="bi bi-chat-heart text-4xl text-[#2A7387]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-bold text-[#0C3846]">Ceritakan</p>
              <p className="mt-1 text-center text-sm text-[#65828B]">
                Bagikan pendapat
              </p>
            </div>

            <div className="flex min-h-44 flex-col items-center justify-center rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-[#DCEBF0] sm:min-h-52">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF3D9]">
                <i
                  className="bi bi-stars text-4xl text-[#94651B]"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 font-bold text-[#0C3846]">Berkembang</p>
              <p className="mt-1 text-center text-sm text-[#65828B]">
                Kenali potensimu
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Daftar aktivitas */}
      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 lg:px-10 lg:pb-20">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#2A7387]">
              PILIH KEGIATANMU
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#0C3846] sm:text-3xl">
              Mau mencoba apa?
            </h2>
          </div>

          <Link
            href="/aktivitas"
            className="shrink-0 text-sm font-semibold text-[#2A7387] transition hover:text-[#0C3846]"
          >
            Lihat semua
            <i className="bi bi-arrow-up-right ml-2" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </section>

      {/* Penutup */}
      <section className="mx-5 mb-10 rounded-3xl bg-[#0C3846] px-6 py-10 text-center sm:mx-8 sm:px-10 lg:mx-auto lg:max-w-7xl">
        <h2 className="text-2xl font-bold text-white sm:text-3xl">
          Setiap anak punya cara untuk berkembang.
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#D4EAF0] sm:text-base">
          Mulai dari satu pertanyaan, satu ide, dan satu cerita.
        </p>

        <Link
          href="/aktivitas"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-[#0C3846] transition hover:bg-[#E4F4F8]"
        >
          Jelajahi aktivitas
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </Link>
      </section>

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © {new Date().getFullYear()} CARAKA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}