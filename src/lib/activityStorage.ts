
export type ActivityType =
  | "knowledge"
  | "creativity"
  | "self-expression";

export type LearningDifficulty =
  | "Mudah"
  | "Sedang"
  | "Menantang";

export interface ActivityHistoryResponse {
  label: string;
  prompt: string;
  response: string;
  correct?: boolean;
  explanation?: string;

  // PERBAIKAN: Metadata untuk analisis perkembangan Knowledge.
  category?: string;
  difficulty?: LearningDifficulty;
}

export interface ActivityHistoryRecord {
  id: string;
  activity: ActivityType;
  completedAt: string;
  totalItems: number;
  responses: ActivityHistoryResponse[];
  score?: number;
  correctCount?: number;
  grade?: number;
  category?: string;
}

export interface AdaptiveLearningRecommendation {
  recommendedDifficulty: LearningDifficulty;
  accuracy: number;
  totalResponses: number;
  correctResponses: number;
  analyzedSessions: number;
  recommendedCategory: string | null;
  recommendedCategoryAccuracy: number | null;
  message: string;
}

type NewActivityHistory = Omit<ActivityHistoryRecord, "id">;

const STORAGE_KEY = "cakara:activity-history:v1";
const MAX_HISTORY = 50;

// PERBAIKAN: Batas minimum data sebelum sistem memberikan rekomendasi.
const MIN_RESPONSES_FOR_RECOMMENDATION = 5;

// PERBAIKAN: Jumlah sesi terakhir yang dianalisis.
const MAX_SESSIONS_TO_ANALYZE = 5;

// ============================================================
// 1. VALIDASI DATA RIWAYAT
// ============================================================

function isActivityHistoryRecord(
  value: unknown,
): value is ActivityHistoryRecord {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  const validActivity =
    record.activity === "knowledge" ||
    record.activity === "creativity" ||
    record.activity === "self-expression";

  if (
    typeof record.id !== "string" ||
    !validActivity ||
    typeof record.completedAt !== "string" ||
    typeof record.totalItems !== "number" ||
    !Array.isArray(record.responses)
  ) {
    return false;
  }

  return record.responses.every((response: unknown) => {
    if (typeof response !== "object" || response === null) {
      return false;
    }

    const item = response as Record<string, unknown>;

    return (
      typeof item.label === "string" &&
      typeof item.prompt === "string" &&
      typeof item.response === "string"
    );
  });
}

// ============================================================
// 2. MEMBACA RIWAYAT
// ============================================================

export function loadActivityHistory(): ActivityHistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) return [];

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) return [];

    // PERBAIKAN: Abaikan data yang tidak sesuai struktur.
    return parsed.filter(isActivityHistoryRecord);
  } catch (error) {
    console.error("Gagal membaca riwayat CAKARA:", error);
    return [];
  }
}

// ============================================================
// 3. MENYIMPAN RIWAYAT
// ============================================================

export function saveActivityHistory(
  activity: NewActivityHistory,
): boolean {
  if (typeof window === "undefined") return false;

  try {
    const previous = loadActivityHistory();

    const newRecord: ActivityHistoryRecord = {
      ...activity,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    };

    const updated = [newRecord, ...previous].slice(0, MAX_HISTORY);

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(updated),
    );

    return true;
  } catch (error) {
    console.error("Gagal menyimpan riwayat CAKARA:", error);
    return false;
  }
}

// ============================================================
// 4. MEMBACA KATEGORI RESPONS
// ============================================================

// PERBAIKAN: Tetap mendukung riwayat lama yang belum menyimpan
// metadata category secara terpisah.
function getResponseCategory(
  response: ActivityHistoryResponse,
): string | null {
  if (response.category?.trim()) {
    return response.category.trim();
  }

  const separatorIndex = response.label.indexOf("·");

  if (separatorIndex === -1) return null;

  return response.label
    .slice(separatorIndex + 1)
    .trim() || null;
}

// ============================================================
// 5. ANALISIS PERFORMA BELAJAR
// ============================================================

export function getAdaptiveLearningRecommendation(
  grade: number,
  selectedCategory?: string,
): AdaptiveLearningRecommendation | null {
  // PERBAIKAN: Ambil hanya riwayat Knowledge pada kelas yang sama.
  const recentSessions = loadActivityHistory()
    .filter(
      (record) =>
        record.activity === "knowledge" &&
        record.grade === grade,
    )
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() -
        new Date(a.completedAt).getTime(),
    )
    .slice(0, MAX_SESSIONS_TO_ANALYZE);

  if (recentSessions.length === 0) {
    return null;
  }

  // PERBAIKAN: Gabungkan respons yang memiliki hasil benar atau salah.
  const allResponses = recentSessions.flatMap((session) =>
    session.responses
      .filter(
        (response) => typeof response.correct === "boolean",
      )
      .map((response) => ({
        ...response,
        category: getResponseCategory(response),
      })),
  );

  // PERBAIKAN: Analisis kategori yang dipilih jika datanya mencukupi.
  const selectedResponses = selectedCategory
    ? allResponses.filter(
        (response) => response.category === selectedCategory,
      )
    : allResponses;

  const hasEnoughSelectedData =
    selectedResponses.length >= MIN_RESPONSES_FOR_RECOMMENDATION;

  // PERBAIKAN: Jika kategori belum memiliki cukup data,
  // gunakan seluruh kategori sebagai dasar rekomendasi.
  const analyzedResponses = hasEnoughSelectedData
    ? selectedResponses
    : allResponses;

  if (
    analyzedResponses.length <
    MIN_RESPONSES_FOR_RECOMMENDATION
  ) {
    return null;
  }

  // ==========================================================
  // HITUNG AKURASI
  // ==========================================================

  const correctResponses = analyzedResponses.filter(
    (response) => response.correct === true,
  ).length;

  const totalResponses = analyzedResponses.length;

  const accuracy = Math.round(
    (correctResponses / totalResponses) * 100,
  );

  // ==========================================================
  // TENTUKAN TINGKAT KESULITAN
  // ==========================================================

  let recommendedDifficulty: LearningDifficulty;

  if (accuracy < 60) {
    recommendedDifficulty = "Mudah";
  } else if (accuracy < 80) {
    recommendedDifficulty = "Sedang";
  } else {
    recommendedDifficulty = "Menantang";
  }

  // ==========================================================
  // ANALISIS PER KATEGORI
  // ==========================================================

  const categoryMap = new Map<
    string,
    { total: number; correct: number }
  >();

  // PERBAIKAN: Agregasi dilakukan berdasarkan kategori.
  for (const response of allResponses) {
    if (!response.category) continue;

    const current = categoryMap.get(response.category) ?? {
      total: 0,
      correct: 0,
    };

    current.total += 1;

    if (response.correct === true) {
      current.correct += 1;
    }

    categoryMap.set(response.category, current);
  }

  const categoryPerformance = Array.from(
    categoryMap.entries(),
  )
    .filter(([, result]) => result.total >= 3)
    .map(([name, result]) => ({
      name,
      total: result.total,
      correct: result.correct,
      accuracy: Math.round(
        (result.correct / result.total) * 100,
      ),
    }))
    .sort((a, b) => a.accuracy - b.accuracy);

  const weakestCategory = categoryPerformance[0] ?? null;

  // ==========================================================
  // SUSUN REKOMENDASI
  // ==========================================================

  const scopeDescription = selectedCategory
    ? hasEnoughSelectedData
      ? `kategori ${selectedCategory}`
      : `seluruh kategori karena data ${selectedCategory} belum mencukupi`
    : "seluruh kategori";

  let message =
    `Berdasarkan ${totalResponses} jawaban dari ` +
    `${recentSessions.length} sesi terakhir pada ${scopeDescription}, ` +
    `akurasi belajarmu adalah ${accuracy}%. ` +
    `Sesi berikutnya dimulai pada tingkat ${recommendedDifficulty}.`;

  if (weakestCategory) {
    message +=
      ` Kategori yang perlu diperkuat adalah ` +
      `${weakestCategory.name} dengan akurasi ` +
      `${weakestCategory.accuracy}%.`;
  }

  return {
    recommendedDifficulty,
    accuracy,
    totalResponses,
    correctResponses,
    analyzedSessions: recentSessions.length,
    recommendedCategory: weakestCategory?.name ?? null,
    recommendedCategoryAccuracy:
      weakestCategory?.accuracy ?? null,
    message,
  };
}

// ============================================================
// 6. MENGHAPUS RIWAYAT
// ============================================================

export function clearActivityHistory(): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error("Gagal menghapus riwayat CAKARA:", error);
    return false;
  }
}
