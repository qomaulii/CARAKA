
"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import SpeechToTextTextarea from "./SpeechToTextTextarea";
import { saveActivityHistory } from "@/lib/activityStorage";

// PERBAIKAN: GamePlayer sekarang hanya menangani dua aktivitas menulis.
// Knowledge sudah menggunakan komponen KnowledgePlayer tersendiri.
type GameType = "creativity" | "self-expression";

interface GameInfo {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

interface CreativityPrompt {
  icon: string;
  color: string;
  title: string;
  description: string;
  questions: string[];
}

interface SelfExpressionCase {
  title: string;
  situation: string;
  question: string;
  guidance: string[];
}

// ============================================================
// 1. INFORMASI AKTIVITAS
// ============================================================

const gameInfo: Record<GameType, GameInfo> = {
  creativity: {
    number: "02",
    title: "Creativity",
    subtitle: "Kembangkan imajinasimu",
    description:
      "Amati stimulus berikut dan kembangkan imajinasimu menjadi cerita. Tidak ada satu jawaban yang wajib benar.",
    icon: "bi-palette",
  },

  "self-expression": {
    number: "03",
    title: "Self-Expression",
    subtitle: "Ceritakan pendapatmu",
    description:
      "Baca situasi yang diberikan, sampaikan pendapatmu, dan jelaskan alasan di balik pilihan tindakanmu.",
    icon: "bi-chat-square-text",
  },
};

// ============================================================
// 2. STIMULUS CREATIVITY
// ============================================================

const creativityPrompts: CreativityPrompt[] = [
  {
    icon: "bi-tree",
    color: "bg-[#E4F4F8]",
    title: "Taman yang ramai",
    description:
      "Bayangkan sebuah taman dengan pohon besar, bunga berwarna-warni, kupu-kupu, dan beberapa anak yang sedang bermain.",
    questions: [
      "Siapa saja tokoh yang ada di dalam taman tersebut?",
      "Peristiwa menarik apa yang terjadi di taman?",
      "Bagaimana akhir cerita yang ingin kamu buat?",
    ],
  },
  {
    icon: "bi-cloud-sun",
    color: "bg-[#FFF3D9]",
    title: "Hari setelah hujan",
    description:
      "Bayangkan langit yang mulai cerah setelah hujan. Pelangi muncul, burung kembali berkicau, dan terdapat genangan air di jalan.",
    questions: [
      "Apa yang dilakukan tokoh setelah hujan berhenti?",
      "Peristiwa apa yang terjadi ketika pelangi muncul?",
      "Bagaimana tokoh menyelesaikan masalah dalam ceritamu?",
    ],
  },
  {
    icon: "bi-house-heart",
    color: "bg-[#E4F4F8]",
    title: "Rumah impian",
    description:
      "Bayangkan sebuah rumah unik dengan halaman luas, kebun kecil, ruang rahasia, dan berbagai benda menarik di dalamnya.",
    questions: [
      "Seperti apa bentuk rumah yang kamu bayangkan?",
      "Apa hal istimewa yang terdapat di dalam rumah tersebut?",
      "Siapa yang tinggal di sana dan apa kegiatan mereka?",
    ],
  },
];

// ============================================================
// 3. STUDI KASUS SELF-EXPRESSION
// ============================================================

const selfExpressionCases: SelfExpressionCase[] = [
  {
    title: "Teman yang tidak diajak bermain",
    situation:
      "Saat istirahat, kamu melihat seorang teman duduk sendirian. Teman-teman lainnya sedang bermain bersama. Teman tersebut tampak ingin ikut bermain, tetapi belum ada yang mengajaknya.",
    question:
      "Apa yang akan kamu lakukan? Mengapa kamu memilih tindakan tersebut?",
    guidance: [
      "Perhatikan situasi yang dialami temanmu.",
      "Pikirkan tindakan yang dapat membantu.",
      "Jelaskan alasan dari pilihan tindakanmu.",
    ],
  },
  {
    title: "Sampah di halaman sekolah",
    situation:
      "Setelah jam istirahat, kamu melihat banyak sampah berserakan di halaman sekolah. Beberapa teman melewatinya tanpa mengambil sampah. Padahal, halaman tersebut digunakan oleh semua siswa.",
    question:
      "Menurutmu, bagaimana cara mengatasi masalah ini? Jelaskan alasanmu.",
    guidance: [
      "Identifikasi penyebab masalah.",
      "Pikirkan tindakan yang dapat dilakukan.",
      "Jelaskan bagaimana tindakan tersebut membantu lingkungan.",
    ],
  },
  {
    title: "Berbeda pendapat dalam kelompok",
    situation:
      "Kelompokmu sedang membuat poster untuk tugas sekolah. Kamu mempunyai ide yang berbeda dari sebagian besar anggota kelompok. Beberapa teman ingin menggunakan ide mereka sendiri dan belum mempertimbangkan usulanmu.",
    question:
      "Bagaimana kamu menyampaikan ide dan menyelesaikan perbedaan pendapat tersebut?",
    guidance: [
      "Pikirkan cara menyampaikan pendapat dengan sopan.",
      "Pertimbangkan pendapat anggota kelompok lainnya.",
      "Jelaskan cara mencapai kesepakatan bersama.",
    ],
  },
];

// ============================================================
// 4. KOMPONEN UTAMA
// ============================================================

export default function GamePlayer({ game }: { game: string }) {
  // PERBAIKAN: Validasi aktivitas tanpa menghentikan render sebelum Hook.
  const isValidGame =
    game === "creativity" || game === "self-expression";

  // PERBAIKAN: Nilai cadangan menjaga tipe data tetap valid.
  const currentGame: GameType =
    game === "self-expression" ? "self-expression" : "creativity";

  const info = gameInfo[currentGame];

  // Semua Hook harus dipanggil dengan urutan yang konsisten.
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);

  // Menyimpan cerita berdasarkan indeks stimulus.
  const [stories, setStories] = useState<Record<number, string>>({});

  // Menyimpan pendapat berdasarkan indeks studi kasus.
  const [opinions, setOpinions] = useState<Record<number, string>>({});

  const [promptIndex, setPromptIndex] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);

  const [validationMessage, setValidationMessage] = useState("");
  const [historySaveWarning, setHistorySaveWarning] = useState(false);

  // PERBAIKAN: Validasi dilakukan setelah semua Hook dipanggil.
  if (!isValidGame) {
    return null;
  }

  // ==========================================================
  // 5. DATA BERDASARKAN AKTIVITAS
  // ==========================================================
  const isCreativity = currentGame === "creativity";

  const totalItems = isCreativity
    ? creativityPrompts.length
    : selfExpressionCases.length;

  const currentIndex = isCreativity ? promptIndex : caseIndex;

  const currentResponse = isCreativity
    ? stories[promptIndex] ?? ""
    : opinions[caseIndex] ?? "";

  // ==========================================================
  // 6. PERHITUNGAN PROGRES
  // ==========================================================

  const completedCount = isCreativity
    ? creativityPrompts.filter((_, index) =>
        Boolean(stories[index]?.trim()),
      ).length
    : selfExpressionCases.filter((_, index) =>
        Boolean(opinions[index]?.trim()),
      ).length;

  const progress = totalItems > 0
    ? Math.round((completedCount / totalItems) * 100)
    : 0;

  const allResponsesCompleted = completedCount === totalItems;

  // ==========================================================
  // 7. PENYIMPANAN RESPONS
  // ==========================================================

  function handleResponseChange(value: string) {
    setValidationMessage("");

    if (isCreativity) {
      // PERBAIKAN: Simpan cerita sesuai indeks stimulus.
      setStories((previous) => ({
        ...previous,
        [promptIndex]: value,
      }));
    } else {
      // PERBAIKAN: Simpan pendapat sesuai indeks kasus.
      setOpinions((previous) => ({
        ...previous,
        [caseIndex]: value,
      }));
    }
  }

  // ==========================================================
  // 8. NAVIGASI SEBELUMNYA
  // ==========================================================

  function goToPrevious() {
    setValidationMessage("");

    if (currentIndex <= 0) return;

    if (isCreativity) {
      setPromptIndex((previous) => previous - 1);
    } else {
      setCaseIndex((previous) => previous - 1);
    }
  }

  // ==========================================================
  // 9. NAVIGASI BERIKUTNYA
  // ==========================================================

  function goToNext() {
    setValidationMessage("");

    // PERBAIKAN: Respons wajib diisi sebelum berpindah.
    if (!currentResponse.trim()) {
      setValidationMessage(
        "Tuliskan jawabanmu terlebih dahulu sebelum melanjutkan.",
      );
      return;
    }

    if (currentIndex >= totalItems - 1) return;

    if (isCreativity) {
      setPromptIndex((previous) => previous + 1);
    } else {
      setCaseIndex((previous) => previous + 1);
    }
  }

  // ==========================================================
  // 10. MENYELESAIKAN AKTIVITAS
  // ==========================================================

  function finishActivity() {
    setValidationMessage("");

    if (!allResponsesCompleted) {
      setValidationMessage(
        `Kamu sudah mengisi ${completedCount} dari ${totalItems} aktivitas. Lengkapi semua jawaban terlebih dahulu.`,
      );
      return;
    }

    if (isCreativity && !stories[promptIndex]?.trim()) {
      setValidationMessage(
        "Lengkapi cerita pada stimulus ini terlebih dahulu.",
      );
      return;
    }

    if (!isCreativity && !opinions[caseIndex]?.trim()) {
      setValidationMessage(
        "Lengkapi pendapat pada studi kasus ini terlebih dahulu.",
      );
      return;
    }

    // PERBAIKAN: Bentuk data respons untuk riwayat aktivitas.
    const responses = isCreativity
      ? creativityPrompts.map((prompt, index) => ({
          label: `Stimulus ${index + 1}: ${prompt.title}`,
          prompt: prompt.description,
          response: stories[index] ?? "",
        }))
      : selfExpressionCases.map((item, index) => ({
          label: `Studi kasus ${index + 1}: ${item.title}`,
          prompt: `${item.situation}\n\n${item.question}`,
          response: opinions[index] ?? "",
        }));

    // PERBAIKAN: Simpan hasil sebelum menampilkan halaman selesai.
    const saved = saveActivityHistory({
      activity: currentGame,
      completedAt: new Date().toISOString(),
      totalItems,
      responses,
    });

    setHistorySaveWarning(!saved);
    setFinished(true);
  }

  // ==========================================================
  // 11. MENGULANG AKTIVITAS
  // ==========================================================

  function resetGame() {
    setStarted(false);
    setFinished(false);
    setHistorySaveWarning(false);

    setPromptIndex(0);
    setCaseIndex(0);

    // PERBAIKAN: Bersihkan jawaban hanya saat sesi diulang.
    setStories({});
    setOpinions({});

    setValidationMessage("");
  }

  // ==========================================================
  // 12. TAMPILAN
  // ==========================================================

  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">

        {/* NAVIGASI KEMBALI */}
        <Link
          href="/aktivitas"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#65828B] transition hover:text-[#0C3846]"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Kembali ke aktivitas
        </Link>

        <div className="mt-7 rounded-3xl border border-[#DCEBF0] bg-white p-6 sm:p-9">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F4F8]">
                <i
                  className={`bi ${info.icon} text-2xl text-[#2A7387]`}
                  aria-hidden="true"
                />
              </div>

              <div>
                <p className="text-xs font-bold tracking-wide text-[#2A7387]">
                  AKTIVITAS {info.number}
                </p>

                <h1 className="mt-1 text-2xl font-bold text-[#0C3846] sm:text-3xl">
                  {info.title}
                </h1>

                <p className="mt-1 text-sm font-medium text-[#65828B]">
                  {info.subtitle}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[#F1F7F9] px-3 py-2 text-xs font-medium text-[#65828B]">
              CAKARA
            </span>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#65828B] sm:text-base">
            {info.description}
          </p>

          {/* ==================================================
              PROGRES AKTIVITAS
          ================================================== */}

          {started && !finished && (
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#65828B]">
                <span>Progres pengisian jawaban</span>

                <span>
                  {completedCount}/{totalItems} selesai
                </span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-[#E4F4F8]"
                role="progressbar"
                aria-label="Progres aktivitas"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#2A7387] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ==================================================
              HALAMAN PERSIAPAN
          ================================================== */}

          {!started && (
            <div className="mt-8 rounded-2xl bg-[#F7FBFC] p-5 sm:p-6">
              <h2 className="font-bold text-[#0C3846]">
                Sebelum mulai
              </h2>

              {isCreativity ? (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>• Terdapat {creativityPrompts.length} stimulus cerita.</li>
                  <li>• Amati ilustrasi dan baca deskripsinya.</li>
                  <li>• Kembangkan ide menjadi cerita menggunakan bahasamu sendiri.</li>
                  <li>• Isi setiap stimulus sebelum menyelesaikan aktivitas.</li>
                </ul>
              ) : (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>• Terdapat {selfExpressionCases.length} studi kasus.</li>
                  <li>• Baca situasi pada setiap kasus sampai selesai.</li>
                  <li>• Tuliskan pendapat dan alasanmu.</li>
                  <li>• Isi seluruh kasus sebelum menyelesaikan aktivitas.</li>
                </ul>
              )}

              <div className="mt-5 rounded-xl border border-[#DCEBF0] bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0C3846]">
                  <i
                    className="bi bi-lightbulb text-[#2A7387]"
                    aria-hidden="true"
                  />
                  Tidak perlu terburu-buru
                </div>

                <p className="mt-2 text-sm leading-6 text-[#65828B]">
                  Kamu dapat berpindah ke aktivitas sebelumnya untuk
                  memperbaiki jawaban. Jawaban yang sudah ditulis akan
                  tetap tersimpan selama sesi berlangsung.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStarted(true)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 font-semibold text-white transition hover:bg-[#2A7387]"
              >
                Mulai sekarang
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ==================================================
              HALAMAN CREATIVITY
          ================================================== */}

          {started && !finished && isCreativity && (
            <div className="mt-8">

              {/* INFORMASI STIMULUS */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Stimulus {promptIndex + 1} dari {creativityPrompts.length}
                </span>

                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs text-[#65828B]">
                  Imajinasi dan cerita
                </span>
              </div>

              {/* ILUSTRASI STIMULUS */}
              <div className="mt-5 overflow-hidden rounded-3xl bg-[#E4F4F8]">
                <div className="flex min-h-[250px] flex-col items-center justify-center p-7 text-center sm:min-h-[290px]">

                  <div
                    className={`flex h-24 w-24 items-center justify-center rounded-3xl ${creativityPrompts[promptIndex].color}`}
                  >
                    <i
                      className={`bi ${creativityPrompts[promptIndex].icon} text-5xl text-[#2A7387]`}
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="mt-5 text-xl font-bold text-[#0C3846] sm:text-2xl">
                    {creativityPrompts[promptIndex].title}
                  </h2>

                  <p className="mt-3 max-w-lg text-sm leading-7 text-[#65828B]">
                    {creativityPrompts[promptIndex].description}
                  </p>
                </div>
              </div>

              {/* PERTANYAAN PEMBANTU */}
              <div className="mt-6 rounded-2xl border border-[#DCEBF0] p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#0C3846]">
                  <i className="bi bi-stars text-[#94651B]" />
                  Kembangkan ceritamu
                </h3>

                <div className="mt-4 space-y-3">
                  {creativityPrompts[promptIndex].questions.map(
                    (question, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E4F4F8] text-xs font-bold text-[#2A7387]">
                          {index + 1}
                        </span>

                        <p className="pt-1 text-sm leading-6 text-[#65828B]">
                          {question}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* AREA CERITA */}
              <label
                htmlFor="story"
                className="mt-6 block text-sm font-bold text-[#0C3846]"
              >
                Tuliskan ceritamu
              </label>

              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                Gunakan imajinasimu dan buatlah cerita berdasarkan
                stimulus yang telah kamu amati.
              </p>

              <SpeechToTextTextarea
                id="story"
                value={currentResponse}
                onChange={handleResponseChange}
                placeholder="Pada suatu hari, ..."
                rows={7}
                maxLength={2000}
              />

              <div className="mt-2 flex justify-between text-xs text-[#65828B]">
                <span>
                  {currentResponse.trim().length < 10
                    ? "Tuliskan ceritamu secara lengkap."
                    : "Jawaban tersimpan pada sesi ini."}
                </span>

                <span>{currentResponse.length}/2000</span>
              </div>

              {/* STATUS PENGISIAN STIMULUS */}
              <div className="mt-4 flex flex-wrap gap-2">
                {creativityPrompts.map((_, index) => {
                  const answered = Boolean(stories[index]?.trim());
                  const active = promptIndex === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setPromptIndex(index);
                        setValidationMessage("");
                      }}
                      aria-label={`Buka stimulus ${index + 1}`}
                      aria-current={active ? "step" : undefined}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition ${
                        active
                          ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]"
                          : answered
                            ? "border-[#B7DECC] bg-[#E9F7EF] text-[#24734A]"
                            : "border-[#DCEBF0] bg-white text-[#65828B]"
                      }`}
                    >
                      {answered ? (
                        <i className="bi bi-check-lg" />
                      ) : (
                        index + 1
                      )}
                    </button>
                  );
                })}
              </div>

              {/* PESAN VALIDASI */}
              {validationMessage && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {validationMessage}
                </p>
              )}

              {/* NAVIGASI STIMULUS */}
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  disabled={promptIndex === 0}
                  onClick={goToPrevious}
                  className="rounded-xl border border-[#DCEBF0] px-5 py-3 text-sm font-semibold text-[#0C3846] transition hover:bg-[#F7FBFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="bi bi-arrow-left mr-2" />
                  Sebelumnya
                </button>

                {promptIndex < creativityPrompts.length - 1 ? (
                  <button
                    type="button"
                    onClick={goToNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                  >
                    Stimulus berikutnya
                    <i className="bi bi-arrow-right" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishActivity}
                    disabled={!allResponsesCompleted}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selesaikan aktivitas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              HALAMAN SELF-EXPRESSION
          ================================================== */}

          {started && !finished && !isCreativity && (
            <div className="mt-8">

              {/* INFORMASI KASUS */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Studi kasus {caseIndex + 1} dari {selfExpressionCases.length}
                </span>

                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs text-[#65828B]">
                  Pendapat dan alasan
                </span>
              </div>

              {/* SITUASI KASUS */}
              <div className="mt-5 rounded-3xl bg-[#FFF3D9] p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <i
                    className="bi bi-chat-square-heart text-2xl text-[#94651B]"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-5 text-xs font-bold tracking-wide text-[#94651B]">
                  SITUASI
                </p>

                <h2 className="mt-2 text-xl font-bold text-[#0C3846] sm:text-2xl">
                  {selfExpressionCases[caseIndex].title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#655638]">
                  {selfExpressionCases[caseIndex].situation}
                </p>
              </div>

              {/* PERTANYAAN REFLEKTIF */}
              <div className="mt-6 rounded-2xl border border-[#DCEBF0] p-5">
                <h3 className="font-bold leading-7 text-[#0C3846]">
                  {selfExpressionCases[caseIndex].question}
                </h3>

                <div className="mt-4 space-y-3">
                  {selfExpressionCases[caseIndex].guidance.map(
                    (guidance, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF3D9] text-xs font-bold text-[#94651B]">
                          {index + 1}
                        </span>

                        <p className="pt-1 text-sm leading-6 text-[#65828B]">
                          {guidance}
                        </p>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* AREA PENDAPAT */}
              <label
                htmlFor="opinion"
                className="mt-6 block text-sm font-bold text-[#0C3846]"
              >
                Sampaikan pendapatmu
              </label>

              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                Jelaskan tindakan yang akan kamu pilih beserta
                alasan yang mendukung pendapatmu.
              </p>

              <SpeechToTextTextarea
                id="opinion"
                value={currentResponse}
                onChange={handleResponseChange}
                placeholder="Menurut saya, tindakan yang tepat adalah ..."
                rows={7}
                maxLength={2000}
              />

              <div className="mt-2 flex justify-between text-xs text-[#65828B]">
                <span>
                  {currentResponse.trim().length < 10
                    ? "Jelaskan pendapatmu secara lengkap."
                    : "Jawaban tersimpan pada sesi ini."}
                </span>

                <span>{currentResponse.length}/2000</span>
              </div>

              {/* STATUS PENGISIAN KASUS */}
              <div className="mt-4 flex flex-wrap gap-2">
                {selfExpressionCases.map((_, index) => {
                  const answered = Boolean(opinions[index]?.trim());
                  const active = caseIndex === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        setCaseIndex(index);
                        setValidationMessage("");
                      }}
                      aria-label={`Buka studi kasus ${index + 1}`}
                      aria-current={active ? "step" : undefined}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold transition ${
                        active
                          ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]"
                          : answered
                            ? "border-[#B7DECC] bg-[#E9F7EF] text-[#24734A]"
                            : "border-[#DCEBF0] bg-white text-[#65828B]"
                      }`}
                    >
                      {answered ? (
                        <i className="bi bi-check-lg" />
                      ) : (
                        index + 1
                      )}
                    </button>
                  );
                })}
              </div>

              {/* PESAN VALIDASI */}
              {validationMessage && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {validationMessage}
                </p>
              )}

              {/* NAVIGASI KASUS */}
              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  disabled={caseIndex === 0}
                  onClick={goToPrevious}
                  className="rounded-xl border border-[#DCEBF0] px-5 py-3 text-sm font-semibold text-[#0C3846] transition hover:bg-[#F7FBFC] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className="bi bi-arrow-left mr-2" />
                  Sebelumnya
                </button>

                {caseIndex < selfExpressionCases.length - 1 ? (
                  <button
                    type="button"
                    onClick={goToNext}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                  >
                    Kasus berikutnya
                    <i className="bi bi-arrow-right" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={finishActivity}
                    disabled={!allResponsesCompleted}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selesaikan aktivitas
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              HALAMAN HASIL CREATIVITY DAN SELF-EXPRESSION
          ================================================== */}

          {finished && (
            <div className="mt-8">

              {/* HEADER HASIL */}
              <div className="rounded-3xl bg-[#F1F7F9] p-6 text-center sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                  <i
                    className="bi bi-trophy text-3xl text-[#94651B]"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-5 text-sm font-bold tracking-wide text-[#2A7387]">
                  AKTIVITAS SELESAI
                </p>

                <h2 className="mt-2 text-2xl font-bold text-[#0C3846] sm:text-3xl">
                  Terima kasih sudah mencoba!
                </h2>

                <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#65828B]">
                  {isCreativity
                    ? "Kamu telah menyelesaikan seluruh stimulus dan menuangkan ide menjadi cerita. Terus kembangkan imajinasimu!"
                    : "Kamu telah menyampaikan pendapat pada seluruh studi kasus. Terus berlatih menjelaskan alasan dan gagasanmu!"}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#2A7387]">
                  <i className="bi bi-check-circle-fill" />
                  {completedCount} dari {totalItems} respons selesai
                </div>
              </div>

              {/* PERBAIKAN: Peringatan jika riwayat gagal tersimpan. */}
              {historySaveWarning && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
                >
                  Aktivitas selesai, tetapi riwayat belum berhasil disimpan
                  pada browser ini. Jawabanmu masih terlihat selama halaman
                  belum ditutup.
                </p>
              )}

              {/* RANGKUMAN RESPONS SISWA */}
              <div className="mt-7">
                <h3 className="text-lg font-bold text-[#0C3846]">
                  {isCreativity
                    ? "Cerita yang telah kamu buat"
                    : "Pendapat yang telah kamu sampaikan"}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#65828B]">
                  Berikut rangkuman seluruh respons selama aktivitas.
                </p>

                <div className="mt-5 space-y-4">
                  {isCreativity
                    ? creativityPrompts.map((prompt, index) => (
                        <article
                          key={index}
                          className="rounded-2xl border border-[#DCEBF0] bg-white p-5"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${prompt.color}`}
                            >
                              <i
                                className={`bi ${prompt.icon} text-xl text-[#2A7387]`}
                              />
                            </div>

                            <div>
                              <p className="text-xs font-semibold text-[#2A7387]">
                                STIMULUS {index + 1}
                              </p>

                              <h4 className="font-bold text-[#0C3846]">
                                {prompt.title}
                              </h4>
                            </div>
                          </div>

                          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#496C77]">
                            {stories[index]}
                          </p>
                        </article>
                      ))
                    : selfExpressionCases.map((item, index) => (
                        <article
                          key={index}
                          className="rounded-2xl border border-[#DCEBF0] bg-white p-5"
                        >
                          <p className="text-xs font-semibold text-[#2A7387]">
                            STUDI KASUS {index + 1}
                          </p>

                          <h4 className="mt-1 font-bold text-[#0C3846]">
                            {item.title}
                          </h4>

                          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#496C77]">
                            {opinions[index]}
                          </p>
                        </article>
                      ))}
                </div>
              </div>

              {/* CATATAN HASIL */}
              <div className="mt-7 rounded-2xl border border-[#DCEBF0] bg-[#F7FBFC] p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0C3846]">
                  <i className="bi bi-info-circle text-[#2A7387]" />
                  Catatan aktivitas
                </div>

                <p className="mt-2 text-sm leading-6 text-[#65828B]">
                  Hasil ini merupakan kumpulan respons yang kamu tulis
                  selama aktivitas. Belum terdapat penilaian otomatis
                  atas kreativitas atau kualitas pendapatmu.
                </p>
              </div>

              {/* TOMBOL AKHIR */}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetGame}
                  className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                >
                  Coba lagi
                </button>

                <Link
                  href="/aktivitas"
                  className="rounded-xl border border-[#DCEBF0] bg-white px-6 py-3 text-sm font-semibold text-[#0C3846] transition hover:border-[#9FD3E3]"
                >
                  Pilih aktivitas lain
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* PERBAIKAN: Tahun statis agar aman saat prerendering. */}
      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © 2026 CAKARA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}
