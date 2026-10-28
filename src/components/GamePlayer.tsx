"use client";

import Link from "next/link";
import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";

type GameType = "knowledge" | "creativity" | "self-expression";

const quizQuestions = [
  {
    question: "Mengapa kita perlu menjaga kebersihan lingkungan?",
    options: [
      "Agar lingkungan sehat dan nyaman",
      "Agar sampah semakin banyak",
      "Agar tanaman tidak tumbuh",
      "Agar air menjadi kotor",
    ],
    answer: 0,
    explanation:
      "Lingkungan yang bersih membantu menjaga kesehatan dan membuat kita nyaman beraktivitas.",
  },
  {
    question: "Jika semua tanaman membutuhkan air, apa yang terjadi jika tanaman tidak mendapat air dalam waktu lama?",
    options: [
      "Tanaman pasti tumbuh lebih cepat",
      "Tanaman dapat layu",
      "Tanaman berubah menjadi batu",
      "Tanaman tidak membutuhkan cahaya",
    ],
    answer: 1,
    explanation:
      "Air dibutuhkan tanaman untuk menjalankan proses kehidupannya. Kekurangan air dapat menyebabkan tanaman layu.",
  },
  {
    question: "Kamu melihat teman kesulitan memahami pelajaran. Apa tindakan yang tepat?",
    options: [
      "Menertawakannya",
      "Membiarkannya tanpa peduli",
      "Menawarkan bantuan untuk belajar bersama",
      "Menyembunyikan bukunya",
    ],
    answer: 2,
    explanation:
      "Belajar bersama dan menawarkan bantuan merupakan cara yang baik untuk mendukung teman.",
  },
  {
    question: "Manakah kegiatan yang dapat mengurangi sampah plastik?",
    options: [
      "Menggunakan botol minum sekali pakai setiap hari",
      "Membuang sampah ke sungai",
      "Membakar semua sampah plastik",
      "Menggunakan botol minum yang dapat dipakai ulang",
    ],
    answer: 3,
    explanation:
      "Botol yang dapat dipakai ulang membantu mengurangi penggunaan plastik sekali pakai.",
  },
  {
    question: "Jika kamu memiliki tiga buku dan teman memberikan dua buku lagi, berapa jumlah bukumu sekarang?",
    options: ["Empat buku", "Lima buku", "Enam buku", "Tujuh buku"],
    answer: 1,
    explanation:
      "Tiga ditambah dua sama dengan lima buku.",
  },
];

const gameInfo: Record<
  GameType,
  {
    number: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
  }
> = {
  knowledge: {
    number: "01",
    title: "Knowledge",
    subtitle: "Uji pengetahuanmu",
    description:
      "Baca setiap pertanyaan dengan teliti, lalu pilih jawaban yang menurutmu paling tepat.",
    icon: "bi-lightbulb",
  },
  creativity: {
    number: "02",
    title: "Creativity",
    subtitle: "Kembangkan imajinasimu",
    description:
      "Amati ilustrasi berikut. Gunakan imajinasimu untuk membuat cerita yang menarik.",
    icon: "bi-palette",
  },
  "self-expression": {
    number: "03",
    title: "Self-Expression",
    subtitle: "Ceritakan pendapatmu",
    description:
      "Baca studi kasus berikut. Sampaikan pendapatmu dan jelaskan alasan di baliknya.",
    icon: "bi-chat-square-text",
  },
};

const creativityPrompts = [
  {
    icon: "bi-tree",
    color: "bg-[#E4F4F8]",
    title: "Taman yang ramai",
    description:
      "Bayangkan sebuah taman dengan pohon besar, bunga berwarna-warni, dan beberapa anak yang sedang bermain.",
  },
  {
    icon: "bi-cloud-sun",
    color: "bg-[#FFF3D9]",
    title: "Hari setelah hujan",
    description:
      "Bayangkan langit mulai cerah, muncul pelangi, dan terdapat genangan air di jalan.",
  },
  {
    icon: "bi-house-heart",
    color: "bg-[#E4F4F8]",
    title: "Rumah impian",
    description:
      "Bayangkan sebuah rumah unik dengan halaman luas, kebun kecil, dan ruang rahasia.",
  },
];

const selfExpressionCases = [
  {
    title: "Teman yang tidak diajak bermain",
    situation:
      "Saat istirahat, kamu melihat seorang teman duduk sendirian. Teman-teman lainnya sedang bermain bersama.",
    question:
      "Apa yang akan kamu lakukan? Mengapa kamu memilih tindakan tersebut?",
  },
  {
    title: "Sampah di halaman sekolah",
    situation:
      "Setelah jam istirahat, kamu melihat banyak sampah berserakan di halaman sekolah. Beberapa teman melewatinya tanpa mengambil sampah.",
    question:
      "Menurutmu, bagaimana cara mengatasi masalah ini? Jelaskan alasanmu.",
  },
  {
    title: "Berbeda pendapat dalam kelompok",
    situation:
      "Kelompokmu sedang membuat poster. Kamu mempunyai ide yang berbeda dari sebagian besar anggota kelompok.",
    question:
      "Bagaimana kamu menyampaikan ide dan menyelesaikan perbedaan pendapat tersebut?",
  },
];

export default function GamePlayer({ game }: { game: string }) {
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const [promptIndex, setPromptIndex] = useState(0);
  const [story, setStory] = useState("");

  const [caseIndex, setCaseIndex] = useState(0);
  const [opinion, setOpinion] = useState("");

  if (!Object.prototype.hasOwnProperty.call(gameInfo, game)) {
    return null;
  }

  const currentGame = game as GameType;
  const info = gameInfo[currentGame];

  function resetGame() {
    setStarted(false);
    setFinished(false);
    setQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setPromptIndex(0);
    setStory("");
    setCaseIndex(0);
    setOpinion("");
  }

  function chooseAnswer(index: number) {
    if (showExplanation) return;

    setSelectedAnswer(index);
  }

  function submitAnswer() {
    if (selectedAnswer === null) return;

    setAnswers((previous) => [
      ...previous.slice(0, questionIndex),
      selectedAnswer,
    ]);

    setShowExplanation(true);
  }

  function nextQuestion() {
    if (questionIndex < quizQuestions.length - 1) {
      setQuestionIndex((previous) => previous + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
    }
  }

  function finishWritingGame() {
    setFinished(true);
  }

  const score = answers.reduce(
    (total, answer, index) =>
      total + (answer === quizQuestions[index].answer ? 1 : 0),
    0,
  );

  const progress =
    currentGame === "knowledge"
      ? ((questionIndex + (showExplanation ? 1 : 0)) /
          quizQuestions.length) *
        100
      : currentGame === "creativity"
        ? 100
        : 100;

  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          href="/aktivitas"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#65828B] transition hover:text-[#0C3846]"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Kembali ke aktivitas
        </Link>

        <div className="mt-7 rounded-3xl border border-[#DCEBF0] bg-white p-6 sm:p-9">
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
              </div>
            </div>

            <span className="rounded-full bg-[#F1F7F9] px-3 py-2 text-xs font-medium text-[#65828B]">
              CARAKA
            </span>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#65828B] sm:text-base">
            {info.description}
          </p>

          {started && !finished && (
            <div className="mt-7">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[#65828B]">
                <span>Progres aktivitas</span>
                <span>{Math.round(progress)}%</span>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-[#E4F4F8]"
                role="progressbar"
                aria-valuenow={Math.round(progress)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#2A7387] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {!started && (
            <div className="mt-8 rounded-2xl bg-[#F7FBFC] p-5 sm:p-6">
              <h2 className="font-bold text-[#0C3846]">
                Sebelum mulai
              </h2>

              {currentGame === "knowledge" && (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>• Terdapat 5 pertanyaan pilihan ganda.</li>
                  <li>• Pilih satu jawaban untuk setiap pertanyaan.</li>
                  <li>• Baca penjelasan setelah menjawab.</li>
                </ul>
              )}

              {currentGame === "creativity" && (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>• Amati ilustrasi dan deskripsinya.</li>
                  <li>• Buat cerita menggunakan imajinasimu.</li>
                  <li>• Tidak ada satu jawaban yang wajib benar.</li>
                </ul>
              )}

              {currentGame === "self-expression" && (
                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>• Baca studi kasus sampai selesai.</li>
                  <li>• Tuliskan pendapatmu dengan bahasamu sendiri.</li>
                  <li>• Jelaskan alasan dan solusi yang kamu pilih.</li>
                </ul>
              )}

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

          {started && !finished && currentGame === "knowledge" && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Pertanyaan {questionIndex + 1} dari {quizQuestions.length}
                </span>

                <span className="text-xs text-[#65828B]">
                  Pilihan ganda
                </span>
              </div>

              <h2 className="mt-5 text-xl leading-8 font-bold text-[#0C3846] sm:text-2xl">
                {quizQuestions[questionIndex].question}
              </h2>

              <div className="mt-6 space-y-3">
                {quizQuestions[questionIndex].options.map(
                  (option, index) => {
                    const isSelected = selectedAnswer === index;
                    const isCorrect =
                      quizQuestions[questionIndex].answer === index;

                    let optionStyle =
                      "border-[#DCEBF0] bg-white hover:border-[#9FD3E3]";

                    if (isSelected) {
                      optionStyle = "border-[#2A7387] bg-[#E4F4F8]";
                    }

                    if (showExplanation && isCorrect) {
                      optionStyle = "border-green-500 bg-green-50";
                    } else if (showExplanation && isSelected && !isCorrect) {
                      optionStyle = "border-red-300 bg-red-50";
                    }

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={showExplanation}
                        onClick={() => chooseAnswer(index)}
                        className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${optionStyle}`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F7F9] text-sm font-bold text-[#2A7387]">
                          {String.fromCharCode(65 + index)}
                        </span>

                        <span className="text-sm leading-6 text-[#173B46]">
                          {option}
                        </span>

                        {showExplanation && isCorrect && (
                          <i
                            className="bi bi-check-circle ml-auto text-green-600"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  },
                )}
              </div>

              {showExplanation && (
                <div className="mt-5 rounded-2xl bg-[#F1F7F9] p-4">
                  <p className="font-bold text-[#0C3846]">
                    {selectedAnswer === quizQuestions[questionIndex].answer
                      ? "Jawabanmu benar!"
                      : "Belum tepat, coba pelajari penjelasannya."}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#65828B]">
                    {quizQuestions[questionIndex].explanation}
                  </p>
                </div>
              )}

              <div className="mt-7 flex justify-end">
                {!showExplanation ? (
                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={selectedAnswer === null}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Periksa jawaban
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                  >
                    {questionIndex === quizQuestions.length - 1
                      ? "Lihat hasil"
                      : "Pertanyaan berikutnya"}
                    <i className="bi bi-arrow-right" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          )}

          {started && !finished && currentGame === "creativity" && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Stimulus {promptIndex + 1} dari {creativityPrompts.length}
                </span>

                <span className="text-xs text-[#65828B]">
                  Imajinasi dan cerita
                </span>
              </div>

              <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-3xl bg-[#E4F4F8] p-7 text-center">
                <div
                  className={`flex h-24 w-24 items-center justify-center rounded-3xl ${creativityPrompts[promptIndex].color}`}
                >
                  <i
                    className={`bi ${creativityPrompts[promptIndex].icon} text-5xl text-[#2A7387]`}
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-5 text-xl font-bold text-[#0C3846]">
                  {creativityPrompts[promptIndex].title}
                </h2>

                <p className="mt-3 max-w-lg text-sm leading-6 text-[#65828B]">
                  {creativityPrompts[promptIndex].description}
                </p>
              </div>

              <label
                htmlFor="story"
                className="mt-6 block text-sm font-bold text-[#0C3846]"
              >
                Buat ceritamu
              </label>

              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                Siapa tokohnya? Apa yang terjadi? Bagaimana ceritanya berakhir?
              </p>

              <textarea
                id="story"
                value={story}
                onChange={(event) => setStory(event.target.value)}
                placeholder="Tuliskan cerita kreatifmu di sini..."
                rows={6}
                maxLength={2000}
                className="mt-4 w-full resize-y rounded-2xl border border-[#DCEBF0] bg-white p-4 text-sm leading-7 text-[#173B46] outline-none transition placeholder:text-[#9AB0B7] focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
              />

              <div className="mt-2 text-right text-xs text-[#65828B]">
                {story.length}/2000 karakter
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  disabled={promptIndex === 0}
                  onClick={() =>
                    setPromptIndex((previous) => previous - 1)
                  }
                  className="rounded-xl border border-[#DCEBF0] px-5 py-3 text-sm font-semibold text-[#0C3846] transition hover:bg-[#F7FBFC] disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                {promptIndex < creativityPrompts.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPromptIndex((previous) => previous + 1);
                      setStory("");
                    }}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                  >
                    Stimulus berikutnya
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!story.trim()}
                    onClick={finishWritingGame}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selesaikan aktivitas
                  </button>
                )}
              </div>
            </div>
          )}

          {started && !finished && currentGame === "self-expression" && (
            <div className="mt-8">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Studi kasus {caseIndex + 1} dari {selfExpressionCases.length}
                </span>

                <span className="text-xs text-[#65828B]">
                  Pendapat dan alasan
                </span>
              </div>

              <div className="mt-5 rounded-3xl bg-[#FFF3D9] p-6 sm:p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <i
                    className="bi bi-chat-square-heart text-2xl text-[#94651B]"
                    aria-hidden="true"
                  />
                </div>

                <h2 className="mt-5 text-xl font-bold text-[#0C3846] sm:text-2xl">
                  {selfExpressionCases[caseIndex].title}
                </h2>

                <p className="mt-4 text-sm leading-7 text-[#655638]">
                  {selfExpressionCases[caseIndex].situation}
                </p>
              </div>

              <h3 className="mt-6 font-bold leading-7 text-[#0C3846]">
                {selfExpressionCases[caseIndex].question}
              </h3>

              <label
                htmlFor="opinion"
                className="mt-5 block text-sm font-semibold text-[#173B46]"
              >
                Tulis pendapatmu
              </label>

              <textarea
                id="opinion"
                value={opinion}
                onChange={(event) => setOpinion(event.target.value)}
                placeholder="Menurut saya..."
                rows={6}
                maxLength={2000}
                className="mt-3 w-full resize-y rounded-2xl border border-[#DCEBF0] bg-white p-4 text-sm leading-7 text-[#173B46] outline-none transition placeholder:text-[#9AB0B7] focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
              />

              <div className="mt-2 text-right text-xs text-[#65828B]">
                {opinion.length}/2000 karakter
              </div>

              <div className="mt-6 flex flex-wrap justify-between gap-3">
                <button
                  type="button"
                  disabled={caseIndex === 0}
                  onClick={() => setCaseIndex((previous) => previous - 1)}
                  className="rounded-xl border border-[#DCEBF0] px-5 py-3 text-sm font-semibold text-[#0C3846] transition hover:bg-[#F7FBFC] disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                {caseIndex < selfExpressionCases.length - 1 ? (
                  <button
                    type="button"
                    disabled={!opinion.trim()}
                    onClick={() => {
                      setCaseIndex((previous) => previous + 1);
                      setOpinion("");
                    }}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Kasus berikutnya
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!opinion.trim()}
                    onClick={finishWritingGame}
                    className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Selesaikan aktivitas
                  </button>
                )}
              </div>
            </div>
          )}

          {finished && (
            <div className="mt-8 rounded-3xl bg-[#F1F7F9] p-6 text-center sm:p-9">
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

              {currentGame === "knowledge" ? (
                <>
                  <p className="mt-4 text-[#65828B]">
                    Skor kamu:
                  </p>

                  <p className="mt-2 text-4xl font-bold text-[#0C3846]">
                    {score}/{quizQuestions.length}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#65828B]">
                    {score === quizQuestions.length
                      ? "Semua jawaban benar. Pertahankan rasa ingin tahumu!"
                      : "Setiap pertanyaan adalah kesempatan untuk belajar. Coba lagi untuk berlatih."}
                  </p>
                </>
              ) : (
                <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#65828B]">
                  {currentGame === "creativity"
                    ? "Kamu sudah menuangkan ide menjadi sebuah cerita. Terus kembangkan imajinasimu."
                    : "Kamu sudah menyampaikan pendapat dalam studi kasus. Terus berlatih menjelaskan alasan dan gagasanmu."}
                </p>
              )}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetGame}
                  className="rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#2A7387]"
                >
                  Main lagi
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

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © {new Date().getFullYear()} CARAKA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}