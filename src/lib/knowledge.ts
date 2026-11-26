
import questionBankJson from "@/data/bank_soal_knowledge_cakara_1500.json";

// ============================================================
// 1. TIPE DATA
// ============================================================

export type OptionKey = "A" | "B" | "C" | "D";

export type Difficulty = "Mudah" | "Sedang" | "Menantang";

// PERBAIKAN: Kode kategori disesuaikan dengan JSON versi 500 soal.
export type CategoryKey =
  | "UMUM"
  | "SAINS"
  | "SEJARAH"
  | "NUMERASI"
  | "LITERASI";

export type CategoryFilter = CategoryKey | "ALL";

// PERBAIKAN: Mendukung tiga bentuk soal Knowledge.
export type QuestionType =
  | "single_select"
  | "multiple_select"
  | "true_false";

export interface TrueFalseStatement {
  text: string;
  answer: boolean;
}

export interface BankQuestion {
  id: string;
  category: string;

  // PERBAIKAN: Kelas hanya metadata internal, bukan filter siswa.
  grade?: number;
  phase?: string;

  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  stimulus: string;
  question: string;

  // PERBAIKAN: Properti dibuat fleksibel sesuai jenis soal.
  question_type?: QuestionType;
  options?: Record<OptionKey, string>;
  answer?: OptionKey;
  correct_answers?: OptionKey[];
  statements?: TrueFalseStatement[];

  answer_text?: string;
  explanation: string;
  source: string;
  original_category_id?: string;
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

// ============================================================
// 2. BANK SOAL DAN KONFIGURASI
// ============================================================

const questionBank =
  questionBankJson as unknown as QuestionBank;

// PERBAIKAN: Kategori mengikuti nama dan kode pada JSON terbaru.
export const CATEGORY_OPTIONS = (
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

export const SESSION_SIZE = 10;

// ============================================================
// 3. VALIDASI BENTUK SOAL
// ============================================================

// PERBAIKAN: Memastikan soal memiliki struktur sesuai jenisnya.
export function isValidQuestion(
  question: BankQuestion,
): boolean {
  const type = question.question_type ?? "single_select";

  if (
    !question.id ||
    !question.question ||
    !question.stimulus ||
    !question.explanation ||
    !DIFFICULTY_LEVEL[question.difficulty]
  ) {
    return false;
  }

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
        question.correct_answers.length >= 2 &&
        question.correct_answers.every(
          (key) => key in question.options!,
        ),
    );
  }

  if (type === "true_false") {
    return Boolean(
      question.statements &&
        question.statements.length >= 3 &&
        question.statements.every(
          (statement) =>
            typeof statement.text === "string" &&
            typeof statement.answer === "boolean",
        ),
    );
  }

  return false;
}

// ============================================================
// 4. MENGAMBIL KUMPULAN SOAL
// ============================================================

// PERBAIKAN: Pemilihan soal cukup berdasarkan kategori.
// Tidak ada lagi penyaringan berdasarkan kelas.
export function getQuestionPool(
  category?: CategoryFilter,
): BankQuestion[];

// PERBAIKAN: Kompatibilitas untuk kode lama yang masih
// memanggil getQuestionPool(grade, category).
export function getQuestionPool(
  legacyGrade: number,
  category: CategoryFilter,
): BankQuestion[];

export function getQuestionPool(
  categoryOrLegacyGrade: CategoryFilter | number = "ALL",
  legacyCategory?: CategoryFilter,
): BankQuestion[] {
  // PERBAIKAN: Parameter kelas lama diabaikan.
  const category =
    typeof categoryOrLegacyGrade === "number"
      ? legacyCategory ?? "ALL"
      : categoryOrLegacyGrade;

  const selectedCategories =
    category === "ALL"
      ? Object.values(questionBank.categories)
      : [questionBank.categories[category]];

  return selectedCategories
    .filter(
      (item): item is QuestionCategory => Boolean(item),
    )
    .flatMap((item) => item.questions ?? [])
    .filter(isValidQuestion);
}

// ============================================================
// 5. PENGACAKAN SOAL
// ============================================================

export function shuffleQuestions<T>(items: T[]): T[] {
  const shuffled = [...items];

  // Menggunakan algoritma Fisher-Yates.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1),
    );

    [shuffled[i], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[i],
    ];
  }

  return shuffled;
}

// ============================================================
// 6. PEMILIHAN SOAL DALAM SATU SESI
// ============================================================

// Mengutamakan stimulus berbeda agar bacaan tidak berulang dalam satu sesi,
// dengan komposisi tingkat kesulitan mengikuti tingkat belajar siswa.
export function selectSessionQuestions(
  pool: BankQuestion[],
  sessionSize: number = SESSION_SIZE,
  learningLevel: Difficulty | null = null,
): BankQuestion[] {
  if (pool.length === 0 || sessionSize <= 0) {
    return [];
  }

  let quotas: { difficulty: Difficulty; count: number }[];

  if (learningLevel === "Mudah") {
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.6) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.3) },
      {
        difficulty: "Menantang",
        count:
          sessionSize -
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
        count:
          sessionSize -
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
        count:
          sessionSize -
          Math.round(sessionSize * 0.2) -
          Math.round(sessionSize * 0.3),
      },
    ];
  } else {
    // Komposisi asesmen awal 40% : 40% : 20%.
    quotas = [
      { difficulty: "Mudah", count: Math.round(sessionSize * 0.4) },
      { difficulty: "Sedang", count: Math.round(sessionSize * 0.4) },
      {
        difficulty: "Menantang",
        count: sessionSize - Math.round(sessionSize * 0.4) * 2,
      },
    ];
  }

  const shuffledPool = shuffleQuestions(pool);
  const selected: BankQuestion[] = [];
  const usedIds = new Set<string>();
  const usedStimuli = new Set<string>();

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

  // Lengkapi sesi jika kuota kesulitan tertentu belum mencukupi.
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

  // Jika stimulus unik tidak mencukupi, gunakan soal lain yang belum terpilih.
  for (const question of shuffledPool) {
    if (selected.length >= sessionSize) break;
    if (usedIds.has(question.id)) continue;

    selected.push(question);
    usedIds.add(question.id);
  }

  return shuffleQuestions(selected).slice(0, sessionSize);
}

// ============================================================
// 6B. EVALUASI TINGKAT BELAJAR ANTAR-SESI
// ============================================================

/** Mengevaluasi tingkat belajar Knowledge berikutnya berdasarkan akurasi tiap tingkat kesulitan. */
export function evaluateNextLearningLevel(
  answers: ReadonlyArray<{ difficulty: Difficulty; isCorrect: boolean }>,
): Difficulty {
  const getPerformance = (difficulty: Difficulty) => {
    const difficultyAnswers = answers.filter(
      (answer) => answer.difficulty === difficulty,
    );
    const correct = difficultyAnswers.filter((answer) => answer.isCorrect).length;

    return {
      total: difficultyAnswers.length,
      percentage:
        difficultyAnswers.length > 0
          ? correct / difficultyAnswers.length
          : 0,
    };
  };

  const easyResult = getPerformance("Mudah");
  const mediumResult = getPerformance("Sedang");
  const challengingResult = getPerformance("Menantang");

  const passesEasy = easyResult.total > 0 && easyResult.percentage >= 0.75;
  const passesMedium = mediumResult.total > 0 && mediumResult.percentage >= 0.75;
  const passesChallenging =
    challengingResult.total > 0 && challengingResult.percentage >= 0.5;

  if (passesEasy && passesMedium && passesChallenging) {
    return "Menantang";
  }

  if (passesEasy) {
    return "Sedang";
  }

  return "Mudah";
}

// ============================================================
// 7. MEKANISME PEMILIHAN ADAPTIF
// ============================================================

export function chooseAdaptiveQuestion(
  remainingQuestions: BankQuestion[],
  targetDifficulty: Difficulty,
): BankQuestion | null {
  if (remainingQuestions.length === 0) {
    return null;
  }

  const targetLevel =
    DIFFICULTY_LEVEL[targetDifficulty];

  // PERBAIKAN: Mencari soal dengan jarak tingkat kesulitan
  // paling dekat terhadap tingkat yang ditargetkan.
  const closestDistance = Math.min(
    ...remainingQuestions.map((question) =>
      Math.abs(
        DIFFICULTY_LEVEL[question.difficulty] -
          targetLevel,
      ),
    ),
  );

  const candidates = remainingQuestions.filter(
    (question) =>
      Math.abs(
        DIFFICULTY_LEVEL[question.difficulty] -
          targetLevel,
      ) === closestDistance,
  );

  return (
    candidates[
      Math.floor(Math.random() * candidates.length)
    ] ?? null
  );
}

// ============================================================
// 8. PENYESUAIAN TINGKAT KESULITAN
// ============================================================

export function adjustDifficulty(
  current: Difficulty,
  isCorrect: boolean,
): Difficulty {
  const currentLevel = DIFFICULTY_LEVEL[current];

  // Jawaban benar menaikkan satu tingkat.
  // Jawaban salah menurunkan satu tingkat.
  const nextLevel = Math.max(
    1,
    Math.min(
      3,
      currentLevel + (isCorrect ? 1 : -1),
    ),
  );

  const nextDifficulty = Object.entries(
    DIFFICULTY_LEVEL,
  ).find(([, level]) => level === nextLevel);

  return (
    (nextDifficulty?.[0] as Difficulty) ?? "Sedang"
  );
}
