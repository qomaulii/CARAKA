
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import { saveActivityHistory } from "@/lib/activityStorage";
import questionBankJson from "@/data/bank_soal_knowledge_cakara_1500.json";

// ============================================================
// 1. TIPE DATA
// ============================================================

type OptionKey = "A" | "B" | "C" | "D";

type Difficulty = "Mudah" | "Sedang" | "Menantang";

type CategoryKey = "UMUM" | "SAINS" | "SEJARAH" | "NUMERASI" | "LITERASI";

type CategoryFilter = CategoryKey | "ALL";

type QuestionType = "single_select" | "multiple_select" | "true_false";

type QuizPhase = "setup" | "playing" | "result";

interface TrueFalseStatement {
  text: string;
  answer: boolean;
}

interface BankQuestion {
  id: string;
  category: string;
  grade?: number; // Metadata internal, tidak dipilih atau difilter oleh siswa.
  phase?: string;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  stimulus: string;
  question: string;
  question_type: QuestionType;
  options?: Record<OptionKey, string>;
  answer?: OptionKey;
  correct_answers?: OptionKey[];
  statements?: TrueFalseStatement[];
  answer_text?: string;
  explanation: string;
  source: string;
}

interface QuestionCategory {
  name: string;
  description: string;
  questions: BankQuestion[];
}

interface QuestionBank {
  title: string;
  version: string;
  created_date?: string;
  description: string;
  categories: Record<CategoryKey, QuestionCategory>;
}

interface AnswerRecord {
  questionId: string;
  category: string;
  selected: string;
  correctAnswer: string;
  isCorrect: boolean;
  difficulty: Difficulty;
  question: string;
  selectedText: string;
  correctText: string;
  explanation: string;
}

interface CategoryResult {
  key: CategoryKey;
  name: string;
  description: string;
  total: number;
  correct: number;
  percentage: number;
}

// ============================================================
// 2. BANK SOAL DAN KONFIGURASI
// ============================================================

// PERBAIKAN: Data soal dibaca langsung dari file JSON.
const questionBank = questionBankJson as unknown as QuestionBank;

const CATEGORY_OPTIONS = (
  Object.entries(questionBank.categories) as [
    CategoryKey,
    QuestionCategory,
  ][]
).map(([key, category]) => ({
  key,
  name: category.name,
  description: category.description,
}));

const DIFFICULTY_LEVEL: Record<Difficulty, number> = {
  Mudah: 1,
  Sedang: 2,
  Menantang: 3,
};

const SESSION_SIZE = 10;

// ============================================================
// 3. FUNGSI PENGOLAHAN BANK SOAL
// ============================================================

function getQuestionPool(category: CategoryFilter): BankQuestion[] {
  // PERBAIKAN: Tidak ada lagi filter kelas; siswa cukup memilih topik belajar.
  const selectedCategories =
    category === "ALL"
      ? Object.values(questionBank.categories)
      : [questionBank.categories[category]];

  return selectedCategories
    .filter((item): item is QuestionCategory => Boolean(item))
    .flatMap((item) => item.questions ?? [])
    .filter((question) => {
      const type = question.question_type ?? "single_select";

      if (type === "single_select") {
        return Boolean(
          question.options &&
            question.answer &&
            question.answer in question.options,
        );
      }

      if (type === "multiple_select") {
        return Boolean(
          question.options &&
            question.correct_answers &&
            question.correct_answers.length > 1 &&
            question.correct_answers.every((key) => key in question.options!),
        );
      }

      return Boolean(question.statements && question.statements.length >= 3);
    });
}

// PERBAIKAN: Satu sesi mengutamakan stimulus berbeda agar bacaan tidak berulang.

function selectSessionQuestions(
  pool: BankQuestion[],
  sessionSize: number,
  learningLevel: Difficulty | null = null,
): BankQuestion[] {
  // PERBAIKAN: Tentukan komposisi berdasarkan tingkat belajar.
  // null berarti siswa belum memiliki hasil evaluasi sebelumnya.
  let quotas: { difficulty: Difficulty; count: number }[];

  if (learningLevel === "Mudah") {
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.6) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.3) },
      {
        difficulty: "Menantang",
        count: sessionSize -
          Math.round(sessionSize * 0.6) -
          Math.round(sessionSize * 0.3),
      },
    ];
  } else if (learningLevel === "Sedang") {
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.3) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.5) },
      {
        difficulty: "Menantang",
        count: sessionSize -
          Math.round(sessionSize * 0.3) -
          Math.round(sessionSize * 0.5),
      },
    ];
  } else if (learningLevel === "Menantang") {
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.2) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.3) },
      {
        difficulty: "Menantang",
        count: sessionSize -
          Math.round(sessionSize * 0.2) -
          Math.round(sessionSize * 0.3),
      },
    ];
  } else {
    // PERBAIKAN: Komposisi asesmen awal 40% : 40% : 20%.
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.4) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.4) },
      {
        difficulty: "Menantang",
        count: sessionSize -
          Math.round(sessionSize * 0.4) * 2,
      },
    ];
  }

  // PERBAIKAN: Acak seluruh kandidat setiap kali sesi dimulai.
  const shuffledPool = shuffleQuestions(pool);

  const selected: BankQuestion[] = [];
  const usedIds = new Set<string>();
  const usedStimuli = new Set<string>();

  // PERBAIKAN: Pilih soal berdasarkan kuota tingkat kesulitan.
  for (const quota of quotas) {
    const candidates = shuffledPool.filter(
      (question) => question.difficulty === quota.difficulty,
    );

    let count = 0;

    for (const question of candidates) {
      const stimulusKey = question.stimulus?.trim() || question.id;

      if (usedIds.has(question.id) || usedStimuli.has(stimulusKey)) {
        continue;
      }

      selected.push(question);
      usedIds.add(question.id);
      usedStimuli.add(stimulusKey);
      count++;

      if (count >= quota.count || selected.length >= sessionSize) {
        break;
      }
    }
  }

  // PERBAIKAN: Lengkapi sesi jika kuota kesulitan tidak terpenuhi.
  for (const question of shuffledPool) {
    if (selected.length >= sessionSize) break;

    const stimulusKey = question.stimulus?.trim() || question.id;

    if (usedIds.has(question.id) || usedStimuli.has(stimulusKey)) {
      continue;
    }

    selected.push(question);
    usedIds.add(question.id);
    usedStimuli.add(stimulusKey);
  }

  // PERBAIKAN: Jika stimulus unik tidak cukup, gunakan soal lain
  // yang belum terpilih agar sesi tetap dapat dilengkapi.
  for (const question of shuffledPool) {
    if (selected.length >= sessionSize) break;
    if (usedIds.has(question.id)) continue;

    selected.push(question);
    usedIds.add(question.id);
  }

  // PERBAIKAN: Acak kembali seluruh urutan soal sebelum ditampilkan.
  return shuffleQuestions(selected).slice(0, sessionSize);
}

function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items];

  // Fisher-Yates shuffle.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled;
}

// ============================================================
// 4. MEKANISME ADAPTIF
// ============================================================

function chooseAdaptiveQuestion(
  questions: BankQuestion[],
  targetDifficulty: Difficulty,
): BankQuestion | null {
  if (questions.length === 0) return null;

  const targetLevel = DIFFICULTY_LEVEL[targetDifficulty];

  // PERBAIKAN: Cari soal dengan tingkat kesulitan paling dekat.
  const closestDistance = Math.min(
    ...questions.map((question) => {
      const questionLevel = DIFFICULTY_LEVEL[question.difficulty];

      return Math.abs(questionLevel - targetLevel);
    }),
  );

  const candidates = questions.filter((question) => {
    const questionLevel = DIFFICULTY_LEVEL[question.difficulty];

    return Math.abs(questionLevel - targetLevel) === closestDistance;
  });

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

// ============================================================
// 5. KOMPONEN KNOWLEDGE PLAYER
// ============================================================

export default function KnowledgePlayer() {
  const [category, setCategory] = useState<CategoryFilter>("ALL");

  const [phase, setPhase] = useState<QuizPhase>("setup");
  const [setupError, setSetupError] = useState("");

  // PERBAIKAN: State peringatan harus berada di dalam komponen.
  const [historySaveWarning, setHistorySaveWarning] = useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState<BankQuestion | null>(null);

  const [remainingQuestions, setRemainingQuestions] =
    useState<BankQuestion[]>([]);

  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const [selectedOption, setSelectedOption] =
    useState<OptionKey | null>(null);

  // PERBAIKAN: State tambahan untuk Pilihan Ganda Kompleks MCMA.
  const [selectedOptions, setSelectedOptions] = useState<OptionKey[]>([]);

  // PERBAIKAN: State jawaban Benar/Salah untuk setiap pernyataan.
  const [statementAnswers, setStatementAnswers] =
    useState<Record<number, boolean>>({});

  const [questionNumber, setQuestionNumber] = useState(1);
  const [sessionTotal, setSessionTotal] = useState(0);

  const [isChecked, setIsChecked] = useState(false);
  
  // PERBAIKAN: Jumlah soal dihitung berdasarkan kategori pilihan.
  const availableQuestions = useMemo(
    () => getQuestionPool(category).length,
    [category],
  );

  // ==========================================================
  // 6. MEMULAI KUIS
  // ==========================================================

function startQuiz() {
  setSetupError("");
  setHistorySaveWarning(false);

  // PERBAIKAN: Ambil soal berdasarkan kategori pilihan siswa.
  const pool = getQuestionPool(category);

  if (pool.length === 0) {
    setSetupError(
      "Belum ada soal yang tersedia pada kategori ini.",
    );
    return;
  }

  // PERBAIKAN: Baca tingkat belajar yang tersimpan dari sesi sebelumnya.
  let savedLevel: Difficulty | null = null;

  try {
    const storedLevel = localStorage.getItem(
      `cakara_knowledge_level_${category}`,
    );

    if (
      storedLevel === "Mudah" ||
      storedLevel === "Sedang" ||
      storedLevel === "Menantang"
    ) {
      savedLevel = storedLevel;
    }
  } catch (error) {
    console.error("Gagal membaca tingkat belajar:", error);
  }

  // PERBAIKAN: Pilih soal berdasarkan tingkat belajar sebelumnya.
  // Jika belum ada data, sistem menggunakan komposisi asesmen awal.
  const sessionQuestions = selectSessionQuestions(
    pool,
    Math.min(SESSION_SIZE, pool.length),
    savedLevel,
  );

  if (sessionQuestions.length === 0) {
    setSetupError("Soal belum dapat dimuat. Silakan coba kembali.");
    return;
  }

  // PERBAIKAN: Tampilkan soal pertama dari hasil pengacakan.
  setCurrentQuestion(sessionQuestions[0]);

  // PERBAIKAN: Simpan urutan soal berikutnya tanpa mengacak ulang.
  setRemainingQuestions(sessionQuestions.slice(1));

  // PERBAIKAN: Reset data aktivitas sebelumnya.
  setAnswers([]);
  setSelectedOption(null);
  setSelectedOptions([]);
  setStatementAnswers({});
  setQuestionNumber(1);
  setSessionTotal(sessionQuestions.length);
  setIsChecked(false);

  setPhase("playing");
}

  // ==========================================================
  // 7. MEMERIKSA JAWABAN
  // ==========================================================

  function checkAnswer() {
    if (!currentQuestion || isChecked) return;

    const questionType = currentQuestion.question_type ?? "single_select";
    let isCorrect = false;
    let selectedText = "";
    let correctText = "";

    if (questionType === "single_select") {
      if (selectedOption === null || !currentQuestion.options || !currentQuestion.answer) {
        return;
      }

      isCorrect = selectedOption === currentQuestion.answer;
      selectedText = `${selectedOption}. ${currentQuestion.options[selectedOption]}`;
      correctText = `${currentQuestion.answer}. ${currentQuestion.options[currentQuestion.answer]}`;
    } else if (questionType === "multiple_select") {
      const correctAnswers = currentQuestion.correct_answers ?? [];
      const options: Partial<Record<OptionKey, string>> =
        currentQuestion.options ?? {};

      if (selectedOptions.length === 0 || correctAnswers.length === 0) {
        return;
      }

      const selectedSorted = [...selectedOptions].sort();
      const correctSorted = [...correctAnswers].sort();

      isCorrect =
        selectedSorted.length === correctSorted.length &&
        selectedSorted.every((key, index) => key === correctSorted[index]);

      selectedText = selectedSorted
        .map((key) => `${key}. ${options[key] ?? ""}`)
        .join("; ");

      correctText = correctSorted
        .map((key) => `${key}. ${options[key] ?? ""}`)
        .join("; ");
    } else {
      const statements = currentQuestion.statements ?? [];

      if (
        statements.length === 0 ||
        statements.some((_, index) => statementAnswers[index] === undefined)
      ) {
        return;
      }

      isCorrect = statements.every(
        (statement, index) => statementAnswers[index] === statement.answer,
      );

      selectedText = statements
        .map(
          (statement, index) =>
            `${index + 1}. ${statementAnswers[index] ? "Benar" : "Salah"}: ${statement.text}`,
        )
        .join("; ");

      correctText = statements
        .map(
          (statement, index) =>
            `${index + 1}. ${statement.answer ? "Benar" : "Salah"}: ${statement.text}`,
        )
        .join("; ");
    }

    // Simpan ringkasan jawaban untuk riwayat dan rekap hasil.
    setAnswers((previous) => [
      ...previous,
      {
        questionId: currentQuestion.id,
        category: currentQuestion.category,
        selected: selectedText,
        correctAnswer: correctText,
        isCorrect,
        difficulty: currentQuestion.difficulty,
        question: currentQuestion.question,
        selectedText,
        correctText,
        explanation: currentQuestion.explanation,
      },
    ]);

    setIsChecked(true);
  }

  // ==========================================================
  // 8. PERTANYAAN BERIKUTNYA
  // ==========================================================

  function nextQuestion() {
    // PERBAIKAN: Pastikan jawaban sudah diperiksa.
    if (!currentQuestion || !isChecked) {
      return;
    }

    // =========================================================
    // EVALUASI SETELAH 10 SOAL SELESAI
    // =========================================================

    if (questionNumber >= sessionTotal) {
      // PERBAIKAN: Hitung jumlah jawaban benar berdasarkan kesulitan.
      const getPerformance = (difficulty: Difficulty) => {
        const difficultyAnswers = answers.filter(
          (answer) => answer.difficulty === difficulty,
        );

        const correct = difficultyAnswers.filter(
          (answer) => answer.isCorrect,
        ).length;

        return {
          total: difficultyAnswers.length,
          correct,
          percentage:
            difficultyAnswers.length > 0
              ? correct / difficultyAnswers.length
              : 0,
        };
      };

      const easyResult = getPerformance("Mudah");
      const mediumResult = getPerformance("Sedang");
      const challengingResult = getPerformance("Menantang");

      // PERBAIKAN: Tentukan tingkat belajar untuk sesi berikutnya.
      let nextLearningLevel: Difficulty = "Mudah";

      const passesEasy =
        easyResult.total > 0 && easyResult.percentage >= 0.75;

      const passesMedium =
        mediumResult.total > 0 && mediumResult.percentage >= 0.75;

      const passesChallenging =
        challengingResult.total > 0 &&
        challengingResult.percentage >= 0.5;

      if (passesEasy && passesMedium && passesChallenging) {
        nextLearningLevel = "Menantang";
      } else if (passesEasy) {
        nextLearningLevel = "Sedang";
      }

      // PERBAIKAN: Simpan tingkat belajar secara internal per kategori.
      // Hasil klasifikasi tidak ditampilkan kepada siswa.
      try {
        localStorage.setItem(
          `cakara_knowledge_level_${category}`,
          nextLearningLevel,
        );
      } catch (error) {
        console.error("Gagal menyimpan tingkat belajar:", error);
      }

      // PERBAIKAN: Hitung hasil keseluruhan sesi.
      const finalCorrectCount = answers.filter(
        (answer) => answer.isCorrect,
      ).length;

      const finalScore =
        answers.length > 0
          ? Math.round((finalCorrectCount / answers.length) * 100)
          : 0;

      const categoryName =
        category === "ALL"
          ? "Semua kategori"
          : CATEGORY_OPTIONS.find(
              (item) => item.key === category,
            )?.name ?? "Kategori tidak diketahui";

      // PERBAIKAN: Simpan riwayat pengerjaan siswa.
      const saved = saveActivityHistory({
        activity: "knowledge",
        completedAt: new Date().toISOString(),
        totalItems: answers.length,
        score: finalScore,
        correctCount: finalCorrectCount,
        category: categoryName,
        responses: answers.map((answer, index) => ({
          label: `Soal ${index + 1} · ${answer.category}`,
          prompt: answer.question,
          response: answer.selectedText,
          correct: answer.isCorrect,
          explanation: answer.isCorrect
            ? answer.explanation
            : `Jawaban yang tepat: ${answer.correctText}. ${answer.explanation}`,
        })),
      });

      setHistorySaveWarning(!saved);
      setPhase("result");
      return;
    }

    // =========================================================
    // LANJUT KE SOAL BERIKUTNYA
    // =========================================================

    // PERBAIKAN: Ambil soal sesuai urutan acak dari startQuiz().
    const next = remainingQuestions[0];

    if (!next) {
      setPhase("result");
      return;
    }

    setCurrentQuestion(next);

    // PERBAIKAN: Keluarkan soal yang sudah ditampilkan.
    setRemainingQuestions((previous) => previous.slice(1));

    // PERBAIKAN: Reset pilihan jawaban untuk soal berikutnya.
    setQuestionNumber((previous) => previous + 1);
    setSelectedOption(null);
    setSelectedOptions([]);
    setStatementAnswers({});
    setIsChecked(false);
  }

  // ==========================================================
  // 9. MENGULANG KUIS
  // ==========================================================

  function resetQuiz() {
    setCurrentQuestion(null);
    setRemainingQuestions([]);
    setAnswers([]);
    setSelectedOption(null);
    setSelectedOptions([]);
    setStatementAnswers({});
    setQuestionNumber(1);
    setSessionTotal(0);
    setIsChecked(false);
    setSetupError("");
    setPhase("setup");
    setHistorySaveWarning(false);
  }

  // ==========================================================
  // 10. PERHITUNGAN HASIL
  // ==========================================================

  const correctCount = answers.filter(
    (answer) => answer.isCorrect,
  ).length;

  const score =
    answers.length > 0
      ? Math.round((correctCount / answers.length) * 100)
      : 0;

  // PERBAIKAN: Hasil setiap kategori dihitung terpisah.
  const categoryResults: CategoryResult[] = CATEGORY_OPTIONS.flatMap(
    (item) => {
      const categoryAnswers = answers.filter(
        (answer) => answer.category === item.name,
      );

      if (categoryAnswers.length === 0) return [];

      const correct = categoryAnswers.filter(
        (answer) => answer.isCorrect,
      ).length;

      return [
        {
          key: item.key,
          name: item.name,
          description: item.description,
          total: categoryAnswers.length,
          correct,
          percentage: Math.round(
            (correct / categoryAnswers.length) * 100,
          ),
        },
      ];
    },
  );

  // Kategori dengan persentase jawaban benar terendah.
  const weakestCategory = [...categoryResults].sort(
    (a, b) => a.percentage - b.percentage,
  )[0];

  // PERBAIKAN: Menentukan kategori dengan persentase tertinggi.
  const strongestCategory = [...categoryResults].sort(
    (a, b) => b.percentage - a.percentage,
  )[0];

// PERBAIKAN: Kalimat apresiasi menyesuaikan hasil kategori terbaik.
const resultPraise = !strongestCategory
  ? "Good job! Teruslah menjelajahi hal-hal baru."
  : strongestCategory.percentage >= 80
    ? `Wah, kamu makin jago di ${strongestCategory.name}! Siap menjelajahi tantangan berikutnya?`
    : strongestCategory.percentage >= 60
      ? `Good job! Pemahamanmu di ${strongestCategory.name} terus berkembang. Yuk, lanjut eksplorasi!`
      : "Good job sudah berusaha! Masih banyak hal menarik untuk dipelajari. Yuk, coba lagi!";

  // Progres berdasarkan jumlah jawaban yang sudah diperiksa.
  const progress =
    sessionTotal > 0
      ? Math.round((answers.length / sessionTotal) * 100)
      : 0;

  // ==========================================================
  // 11. TAMPILAN
  // ==========================================================

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

          {/* HEADER AKTIVITAS */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F4F8]">
              <i
                className="bi bi-lightbulb text-2xl text-[#2A7387]"
                aria-hidden="true"
              />
            </div>

            <div>
              <p className="text-xs font-bold tracking-wide text-[#2A7387]">
                AKTIVITAS 01
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#0C3846] sm:text-3xl">
                Knowledge
              </h1>
            </div>
          </div>

          <p className="mt-5 text-sm leading-7 text-[#65828B] sm:text-base">
            Uji pengetahuanmu melalui pertanyaan dari berbagai bidang
            pembelajaran. Setiap jawaban akan membantu menentukan tingkat
            kesulitan pertanyaan berikutnya.
          </p>

          {/* ==================================================
              HALAMAN PERSIAPAN
          ================================================== */}

          {phase === "setup" && (
            <div className="mt-8 rounded-2xl bg-[#F7FBFC] p-5 sm:p-6">

              <h2 className="font-bold text-[#0C3846]">
                Siapkan aktivitasmu
              </h2>

              {/* PERBAIKAN: Siswa cukup memilih topik yang ingin dipelajari. */}
              <div className="mt-5">
                <label
                  htmlFor="category"
                  className="mb-2 block text-sm font-semibold text-[#0C3846]"
                >
                  Mau belajar apa hari ini?
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as CategoryFilter);
                    setSetupError("");
                  }}
                  className="w-full rounded-xl border border-[#DCEBF0] bg-white px-4 py-3 text-sm text-[#0C3846] outline-none transition focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
                >
                  <option value="ALL">Semua kategori</option>
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs leading-5 text-[#65828B]">
                  Pilih topik yang paling ingin kamu pelajari. Tingkat soal
                  disusun dari beberapa tingkat kesulitan.
                </p>
              </div>

              {/* PETUNJUK */}
              <div className="mt-5 rounded-xl border border-[#DCEBF0] bg-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#0C3846]">
                  <i
                    className="bi bi-info-circle text-[#2A7387]"
                    aria-hidden="true"
                  />
                  Petunjuk aktivitas
                </div>

                <ul className="mt-3 space-y-2 text-sm leading-6 text-[#65828B]">
                  <li>
                    • Setiap sesi berisi maksimal 10 pertanyaan.
                  </li>
                  <li>
                    • Pilih satu jawaban yang paling tepat.
                  </li>
                  <li>
                    • Pelajari pembahasan setelah memeriksa jawaban.
                  </li>
                  <li>
                    • Tingkat kesulitan soal menyesuaikan jawabanmu.
                  </li>
                </ul>
              </div>

              {/* PERBAIKAN: INFORMASI KETERSEDIAAN SOAL */}
              <div className="mt-4 rounded-xl border border-[#DCEBF0] bg-[#E4F4F8] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-[#0C3846]">
                      {availableQuestions} soal tersedia
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#65828B]">
                      {category === "ALL"
                        ? "Semua kategori"
                        : CATEGORY_OPTIONS.find(
                            (item) => item.key === category,
                          )?.name}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                    <i
                      className="bi bi-journal-check text-xl text-[#2A7387]"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                {availableQuestions > 0 && (
                  <p className="mt-2 text-xs text-[#65828B]">
                    Sesi ini akan menggunakan{" "}
                    {Math.min(SESSION_SIZE, availableQuestions)} pertanyaan.
                  </p>
                )}
              </div>

              {/* PERBAIKAN: TOMBOL MULAI DAN PESAN ERROR */}
              <button
                type="button"
                onClick={startQuiz}
                disabled={availableQuestions === 0}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 font-semibold text-white transition hover:bg-[#2A7387] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {availableQuestions === 0
                  ? "Soal belum tersedia"
                  : "Mulai kuis"}

                <i
                  className="bi bi-arrow-right"
                  aria-hidden="true"
                />
              </button>

              {setupError && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {setupError}
                </p>
              )}
            </div>
          )}

          {/* ==================================================
              HALAMAN PENGERJAAN KUIS
          ================================================== */}

          {phase === "playing" && currentQuestion && (
            <div className="mt-8">

              {/* NOMOR SOAL DAN KESULITAN */}
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#2A7387]">
                  Pertanyaan {questionNumber} dari {sessionTotal}
                </span>

                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs font-semibold text-[#65828B]">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* PROGRES */}
              <div
                className="h-2 overflow-hidden rounded-full bg-[#E4F4F8]"
                role="progressbar"
                aria-label="Progres pengerjaan"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#2A7387] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="mt-2 text-right text-xs text-[#65828B]">
                {progress}% selesai
              </p>

              {/* INFORMASI KATEGORI */}
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#E4F4F8] px-3 py-1.5 text-xs font-semibold text-[#2A7387]">
                  {currentQuestion.category}
                </span>

                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs font-medium text-[#65828B]">
                  {currentQuestion.topic}
                </span>
              </div>

              {/* STIMULUS */}
              {currentQuestion.stimulus && (
                <div className="mt-5 rounded-2xl bg-[#F7FBFC] p-5">
                  <p className="mb-2 text-xs font-bold tracking-wide text-[#2A7387]">
                    BACA DAN AMATI
                  </p>

                  <p className="whitespace-pre-line text-sm leading-7 text-[#496C77]">
                    {currentQuestion.stimulus}
                  </p>
                </div>
              )}

              {/* PERTANYAAN */}
              <h2 className="mt-6 text-lg leading-8 font-bold text-[#0C3846] sm:text-xl">
                {currentQuestion.question}
              </h2>

              {/* PERBAIKAN: Tiga bentuk soal mengikuti format latihan resmi. */}
              <div className="mt-5">
                <p className="mb-3 text-xs font-semibold text-[#65828B]">
                  {currentQuestion.question_type === "multiple_select"
                    ? "PILIHAN GANDA KOMPLEKS · PILIH SEMUA JAWABAN YANG BENAR"
                    : currentQuestion.question_type === "true_false"
                      ? "PILIHAN GANDA KATEGORI · TENTUKAN BENAR ATAU SALAH"
                      : "PILIHAN GANDA · PILIH SATU JAWABAN"}
                </p>

                {(currentQuestion.question_type ?? "single_select") !== "true_false" ? (
                  <div className="space-y-3">
                    {(Object.entries(currentQuestion.options ?? {}) as [OptionKey, string][]).map(([key, value]) => {
                      const isMultiple = currentQuestion.question_type === "multiple_select";
                      const isSelected = isMultiple
                        ? selectedOptions.includes(key)
                        : selectedOption === key;
                      const isCorrect = isMultiple
                        ? (currentQuestion.correct_answers ?? []).includes(key)
                        : currentQuestion.answer === key;

                      let optionStyle =
                        "border-[#DCEBF0] bg-white hover:border-[#9FD3E3]";

                      if (!isChecked && isSelected) {
                        optionStyle = "border-[#2A7387] bg-[#E4F4F8]";
                      }

                      if (isChecked && isCorrect) {
                        optionStyle = "border-green-500 bg-green-50";
                      } else if (isChecked && isSelected && !isCorrect) {
                        optionStyle = "border-red-300 bg-red-50";
                      }

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isChecked}
                          onClick={() => {
                            if (isMultiple) {
                              setSelectedOptions((previous) =>
                                previous.includes(key)
                                  ? previous.filter((item) => item !== key)
                                  : [...previous, key],
                              );
                            } else {
                              setSelectedOption(key);
                            }
                          }}
                          aria-pressed={isSelected}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${optionStyle}`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F7F9] text-sm font-bold text-[#2A7387]">
                            {isMultiple ? (isSelected ? "✓" : "□") : key}
                          </span>

                          <span className="flex-1 text-sm leading-6 text-[#173B46]">
                            {value}
                          </span>

                          {isChecked && isCorrect && (
                            <i className="bi bi-check-circle-fill text-green-600" aria-label="Jawaban benar" />
                          )}

                          {isChecked && isSelected && !isCorrect && (
                            <i className="bi bi-x-circle-fill text-red-500" aria-label="Jawaban belum tepat" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(currentQuestion.statements ?? []).map((statement, index) => {
                      const selected = statementAnswers[index];
                      const isCorrect = selected === statement.answer;

                      return (
                        <div key={`${currentQuestion.id}-statement-${index}`} className="rounded-2xl border border-[#DCEBF0] p-4">
                          <p className="text-sm leading-6 text-[#173B46]">
                            <strong className="mr-2 text-[#2A7387]">{index + 1}.</strong>
                            {statement.text}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {[true, false].map((value) => {
                              const active = selected === value;
                              const correctChoice = statement.answer === value;
                              let style = "border-[#DCEBF0] bg-white text-[#496C77]";

                              if (!isChecked && active) {
                                style = "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]";
                              } else if (isChecked && correctChoice) {
                                style = "border-green-500 bg-green-50 text-green-800";
                              } else if (isChecked && active && !correctChoice) {
                                style = "border-red-300 bg-red-50 text-red-700";
                              }

                              return (
                                <button
                                  key={String(value)}
                                  type="button"
                                  disabled={isChecked}
                                  onClick={() =>
                                    setStatementAnswers((previous) => ({
                                      ...previous,
                                      [index]: value,
                                    }))
                                  }
                                  aria-pressed={active}
                                  className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${style}`}
                                >
                                  {value ? "Benar" : "Salah"}
                                </button>
                              );
                            })}
                          </div>

                          {isChecked && !isCorrect && (
                            <p className="mt-2 text-xs font-semibold text-red-700">
                              Jawaban yang tepat: {statement.answer ? "Benar" : "Salah"}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PEMBAHASAN */}
              {isChecked && (
                <div className="mt-5 rounded-2xl bg-[#F1F7F9] p-5">
                  <p className="font-bold text-[#0C3846]">
                    {answers[answers.length - 1]?.isCorrect
                      ? "Jawabanmu benar!"
                      : "Belum tepat. Mari pelajari pembahasannya."}
                  </p>

                  {!answers[answers.length - 1]?.isCorrect && (
                    <p className="mt-2 text-sm leading-6 text-[#496C77]">
                      <strong>Periksa kembali jawaban yang tepat:</strong>{" "}
                      {answers[answers.length - 1]?.correctText}
                    </p>
                  )}

                  <p className="mt-3 text-sm leading-7 text-[#65828B]">
                    {currentQuestion.explanation}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-[#65828B]">
                    Teruskan belajarmu! Hasil seluruh sesi akan membantu
                    menyiapkan latihan berikutnya.
                  </p>
                </div>
              )}

              {/* TOMBOL PERIKSA DAN LANJUT */}
              <div className="mt-7 flex justify-end">
                {!isChecked ? (
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={
                      (currentQuestion.question_type ?? "single_select") === "single_select"
                        ? selectedOption === null
                        : currentQuestion.question_type === "multiple_select"
                          ? selectedOptions.length === 0
                          : (currentQuestion.statements ?? []).length === 0 ||
                            (currentQuestion.statements ?? []).some(
                              (_, index) => statementAnswers[index] === undefined,
                            )
                    }
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
                    {questionNumber === sessionTotal
                      ? "Lihat hasil"
                      : "Pertanyaan berikutnya"}

                    <i
                      className="bi bi-arrow-right"
                      aria-hidden="true"
                    />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================
              HALAMAN HASIL
          ================================================== */}

          {phase === "result" && (
            <div className="mt-8">

              {/* SKOR KESELURUHAN */}       
              <div className="rounded-3xl bg-[#F1F7F9] p-6 text-center sm:p-9">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                  <i
                    className="bi bi-trophy text-3xl text-[#94651B]"
                    aria-hidden="true"
                  />
                </div>

                <p className="mt-5 text-xs font-bold tracking-wide text-[#2A7387]">
                  SESI KNOWLEDGE SELESAI
                </p>

                <h2 className="mt-3 text-5xl font-extrabold text-[#0C3846] sm:text-6xl">
                  {score}%
                </h2>

                <h3 className="mt-4 text-xl font-bold text-[#0C3846]">
                  Good job!
                </h3>

                <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-[#65828B] sm:text-lg">
                  {resultPraise}
                </p>
              </div>


              {/* PERBAIKAN: Peringatan penyimpanan riwayat. */}
              {historySaveWarning && (
                <p
                  role="alert"
                  className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800"
                >
                  Skor berhasil dihitung, tetapi riwayat belum berhasil
                  disimpan pada browser ini.
                </p>
              )}

              {/* HASIL SETIAP KATEGORI */}
              <div className="mt-8">
                <h3 className="text-lg font-bold text-[#0C3846]">
                  Perjalanan belajarmu
                </h3>

                {categoryResults.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {categoryResults.map((item) => {
                      // PERBAIKAN: Ikon dibedakan berdasarkan kategori.
                      const categoryIcon: Record<CategoryKey, string> = {
                        UMUM: "bi-globe2",
                        SAINS: "bi-flask",
                        SEJARAH: "bi-landmark",
                        NUMERASI: "bi-calculator",
                        LITERASI: "bi-book",
                      };

                      // PERBAIKAN: Pesan singkat mengikuti persentase kategori.
                      const feedback =
                        item.percentage >= 80
                          ? "Hebat! Kamu memahami topik ini dengan baik."
                          : item.percentage >= 60
                            ? "Bagus! Pemahamanmu terus berkembang."
                            : "Yuk, pelajari lagi. Masih banyak hal menarik!";

                      // PERBAIKAN: Warna indikator mengikuti hasil kategori.
                      const progressColor =
                        item.percentage >= 80
                          ? "bg-[#26936A]"
                          : item.percentage >= 60
                            ? "bg-[#2A7387]"
                            : "bg-[#D49A3B]";

                      const feedbackColor =
                        item.percentage >= 80
                          ? "text-[#26936A]"
                          : item.percentage >= 60
                            ? "text-[#2A7387]"
                            : "text-[#A87520]";

                      return (
                        <div
                          key={item.key}
                          className="rounded-2xl border border-[#DCEBF0] bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F4F8]">
                                <i
                                  className={`bi ${categoryIcon[item.key]} text-xl text-[#2A7387]`}
                                  aria-hidden="true"
                                />
                              </div>

                              <p className="text-sm font-bold text-[#0C3846]">
                                {item.name}
                              </p>
                            </div>

                            <span className="text-xl font-extrabold text-[#0C3846]">
                              {item.percentage}%
                            </span>
                          </div>

                          <div
                            className="mt-4 h-2 overflow-hidden rounded-full bg-[#E4F4F8]"
                            role="progressbar"
                            aria-label={`Hasil kategori ${item.name}`}
                            aria-valuenow={item.percentage}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          >
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>

                          <p className={`mt-3 text-xs leading-5 ${feedbackColor}`}>
                            {feedback}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[#65828B]">
                    Belum ada hasil kategori.
                  </p>
                )}
              </div>


              {/* REKOMENDASI LATIHAN */}
              <div className="mt-6 rounded-2xl bg-[#EAF5F7] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
                    <i
                      className="bi bi-compass text-xl text-[#2A7387]"
                      aria-hidden="true"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-[#65828B]">
                      TANTANGAN BERIKUTNYA
                    </p>

                    <h3 className="mt-1 font-bold text-[#0C3846]">
                      {weakestCategory
                        ? `Yuk, jelajahi ${weakestCategory.name} lagi!`
                        : "Yuk, temukan hal baru!"}
                    </h3>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-[#65828B]">
                  {weakestCategory && weakestCategory.percentage >= 80
                    ? "Kamu sudah menunjukkan pemahaman yang baik. Siap mencoba tantangan berikutnya?"
                    : "Masih banyak hal menarik untuk ditemukan. Ayo terus belajar dan eksplorasi!"}
                </p>
              </div>


              {/* TOMBOL AKHIR */}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={resetQuiz}
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

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © 2026 CAKARA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}
