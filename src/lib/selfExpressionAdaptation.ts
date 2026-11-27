import type {
  SelfExpressionAgeBand,
  SelfExpressionComplexity,
  SelfExpressionIndicators,
  SelfExpressionProfile,
  SelfExpressionScenario,
  SelfExpressionSessionRecord,
} from "@/lib/selfExpressionTypes";

interface SelfExpressionRuleCondition {
  elapsedSecondsAtLeast?: number;
  wordCountBelow?: number;
  minScenarioRelevance?: number;
  requiredDimensions?: number;
  maxDimensionsForLow?: number;
  consecutiveSessions?: number;
}

interface SelfExpressionRule {
  id: string;
  condition: SelfExpressionRuleCondition;
  action: string;
}

// Tabel aturan adaptif khusus Self-Expression (terpisah dari Creativity).
export const SELF_EXPRESSION_ADAPTIVE_RULES: SelfExpressionRule[] = [
  {
    id: "GUIDE_INCOMPLETE_RESPONSE",
    condition: { elapsedSecondsAtLeast: 90, wordCountBelow: 8 },
    action:
      "Tampilkan pertanyaan pemandu perasaan, pilihan tindakan, dan alasan jika respons masih singkat atau belum lengkap.",
  },
  {
    id: "INCREASE_SCENARIO_COMPLEXITY",
    condition: { minScenarioRelevance: 1, requiredDimensions: 3 },
    action:
      "Naikkan kompleksitas skenario satu tingkat jika jawaban terkait skenario dan memuat perasaan/opini, tindakan, serta alasan.",
  },
  {
    id: "SIMPLIFY_AFTER_REPEATED_INCOMPLETE",
    condition: { maxDimensionsForLow: 1, consecutiveSessions: 2 },
    action:
      "Turunkan kompleksitas skenario satu tingkat jika indikator kelengkapan rendah pada dua sesi berturut-turut.",
  },
  {
    id: "MAINTAIN_SCENARIO_COMPLEXITY",
    condition: {},
    action:
      "Pertahankan tingkat kompleksitas skenario saat kriteria naik atau turun belum terpenuhi.",
  },
];

const PROFILE_STORAGE_PREFIX = "cakara:self-expression:profile:v1:";
const SESSION_STORAGE_KEY = "cakara:self-expression:sessions:v1";
const MAX_STORED_SESSIONS = 30;
const COMPLEXITY_ORDER: SelfExpressionComplexity[] = [
  "simple",
  "medium",
  "complex",
];

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("id-ID")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhrase(text: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  return ` ${text} `.includes(` ${normalizedPhrase} `);
}

export function shouldShowSelfExpressionHelp(
  elapsedSeconds: number,
  responseText: string,
  scenario: SelfExpressionScenario,
): boolean {
  const rule = SELF_EXPRESSION_ADAPTIVE_RULES.find(
    (item) => item.id === "GUIDE_INCOMPLETE_RESPONSE",
  );
  const waitSeconds = rule?.condition.elapsedSecondsAtLeast ?? 90;
  const indicators = analyzeSelfExpressionResponse(responseText, scenario);

  return elapsedSeconds >= waitSeconds && indicators.isIncompleteResponse;
}

/**
 * Menganalisis keterkaitan skenario, pengungkapan perasaan/opini, pilihan tindakan,
 * alasan, dan kelengkapan respons tanpa memberikan label benar atau salah.
 */
export function analyzeSelfExpressionResponse(
  responseText: string,
  scenario: SelfExpressionScenario,
): SelfExpressionIndicators {
  const normalized = normalizeText(responseText);
  const words = normalized.split(/\s+/).filter(Boolean);

  const matchedScenarioTerms = Array.from(
    new Set(
      scenario.scenarioKeywords.filter((keyword) =>
        containsPhrase(normalized, keyword),
      ),
    ),
  );

  // Indikator perasaan hanya mengenali keadaan emosional, bukan kata "sendiri" yang
  // dapat muncul sebagai keterangan keadaan tanpa menyatakan perasaan.
  const hasFeelingExpression =
    /\b(sedih|kesepian|senang|bahagia|kecewa|bingung|cemas|khawatir|takut|malu|marah|kesal|gugup|lega|bangga|terharu|prihatin|kasihan|iba|bersalah|diabaikan|tidak dihargai|tidak diterima|tidak nyaman|tidak enak hati|merasa sendirian)\b/i.test(
      normalized,
    );

  // Pendapat dikenali dari ungkapan sudut pandang, bukan dari kata "akan" atau kata kerja tindakan.
  const hasOpinionExpression =
    /\b(menurutku|menurut saya|menurut aku|pendapatku|pendapat saya|pendapat aku|saya berpendapat|aku berpendapat|saya pikir|aku pikir|kupikir|saya rasa|aku rasa|kurasa|bagi saya|bagi aku|saya setuju|aku setuju|saya tidak setuju|aku tidak setuju|saya kurang setuju|aku kurang setuju|saya beranggapan|aku beranggapan)\b/i.test(
      normalized,
    );

  // Pilihan tindakan memerlukan kata kerja tindakan yang eksplisit; kata "akan" saja tidak cukup.
  const hasActionChoice =
    /\b(mengajak|ajak|mengundang|membantu|bantu|menolong|tolong|memungut|pungut|membuang|buang|menegur|tegur|mengingatkan|ingatkan|mendengarkan|dengarkan|meminta maaf|minta maaf|meminta izin|minta izin|meminta bantuan|minta bantuan|meminta|minta|mengganti|ganti|mencari|cari|menjelaskan|jelaskan|berdiskusi|diskusi|menyampaikan|sampaikan|mengungkapkan|ungkapkan|berbicara|bicara|berkata|katakan|mengatakan|bilang|memberi tahu|memberitahu|memilih|pilih|memutuskan|putuskan|menolak|tolak|menerima|terima|mengembalikan|kembalikan|melaporkan|laporkan|menemani|temani|menunggu|tunggu|berbagi|menawarkan|tawarkan|menghubungi|hubungi|menyelesaikan|selesaikan|mengerjakan|kerjakan|menjaga|jaga|mengantre|antre|menyapa|sapa|berkenalan|kenalan|mengakui|akui|menghibur|hibur|menenangkan|tenangkan|menghargai|hargai|menghormati|hormati|bertanya|tanya|menjawab|jawab|bermain|main|pergi|ikut|mencoba|coba)\b/i.test(
      normalized,
    );

  const hasReason =
    /\b(karena|soalnya|supaya|agar|sebab|sehingga|alasannya|demi)\b/i.test(
      normalized,
    );

  // Ambang adaptasi tetap tiga kelompok seperti rancangan sebelumnya:
  // (perasaan atau pendapat), tindakan, dan alasan.
  const completedDimensionsCount = [
    hasFeelingExpression || hasOpinionExpression,
    hasActionChoice,
    hasReason,
  ].filter(Boolean).length;

  const minWordsRule =
    SELF_EXPRESSION_ADAPTIVE_RULES.find(
      (item) => item.id === "GUIDE_INCOMPLETE_RESPONSE",
    )?.condition.wordCountBelow ?? 8;

  const isIncompleteResponse =
    words.length < minWordsRule || completedDimensionsCount < 2;

  return {
    matchedScenarioTerms,
    scenarioRelevanceCount: matchedScenarioTerms.length,
    hasFeelingExpression,
    hasOpinionExpression,
    hasActionChoice,
    hasReason,
    completedDimensionsCount,
    wordCount: words.length,
    characterCount: responseText.trim().length,
    isIncompleteResponse,
  };
}

export function createDefaultSelfExpressionProfile(
  ageBand: SelfExpressionAgeBand,
): SelfExpressionProfile {
  return {
    ageBand,
    complexity: "medium",
    lowIndicatorStreak: 0,
    sessionsCompleted: 0,
    recentScenarioIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadSelfExpressionProfile(
  ageBand: SelfExpressionAgeBand,
): SelfExpressionProfile {
  if (typeof window === "undefined") {
    return createDefaultSelfExpressionProfile(ageBand);
  }

  try {
    const raw = window.localStorage.getItem(
      `${PROFILE_STORAGE_PREFIX}${ageBand}`,
    );
    if (!raw) return createDefaultSelfExpressionProfile(ageBand);

    const parsed = JSON.parse(raw) as Partial<SelfExpressionProfile>;
    const validComplexity = COMPLEXITY_ORDER.includes(
      parsed.complexity as SelfExpressionComplexity,
    );

    return {
      ...createDefaultSelfExpressionProfile(ageBand),
      ...parsed,
      ageBand,
      complexity: validComplexity
        ? (parsed.complexity as SelfExpressionComplexity)
        : "medium",
      lowIndicatorStreak:
        typeof parsed.lowIndicatorStreak === "number"
          ? parsed.lowIndicatorStreak
          : 0,
      sessionsCompleted:
        typeof parsed.sessionsCompleted === "number"
          ? parsed.sessionsCompleted
          : 0,
      recentScenarioIds: Array.isArray(parsed.recentScenarioIds)
        ? parsed.recentScenarioIds.filter(
            (value): value is string => typeof value === "string",
          )
        : [],
    };
  } catch {
    return createDefaultSelfExpressionProfile(ageBand);
  }
}

export function saveSelfExpressionProfile(
  profile: SelfExpressionProfile,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      `${PROFILE_STORAGE_PREFIX}${profile.ageBand}`,
      JSON.stringify(profile),
    );
    return true;
  } catch {
    return false;
  }
}

export function saveSelfExpressionSession(
  session: SelfExpressionSessionRecord,
): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const previous = Array.isArray(parsed)
      ? (parsed as SelfExpressionSessionRecord[])
      : [];
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify([...previous, session].slice(-MAX_STORED_SESSIONS)),
    );
    return true;
  } catch {
    return false;
  }
}

export function chooseSelfExpressionScenario(
  scenarios: SelfExpressionScenario[],
  profile: SelfExpressionProfile,
): SelfExpressionScenario | null {
  const ageScenarios = scenarios.filter(
    (item) => item.ageBand === profile.ageBand,
  );
  if (ageScenarios.length === 0) return null;

  let candidates = ageScenarios.filter(
    (item) => item.complexity === profile.complexity,
  );
  if (candidates.length === 0) candidates = ageScenarios;

  const notRecentlyUsed = candidates.filter(
    (item) => !profile.recentScenarioIds.includes(item.id),
  );
  const finalCandidates =
    notRecentlyUsed.length > 0 ? notRecentlyUsed : candidates;

  return (
    finalCandidates[Math.floor(Math.random() * finalCandidates.length)] ?? null
  );
}

function changeComplexity(
  current: SelfExpressionComplexity,
  delta: -1 | 1,
): SelfExpressionComplexity {
  const currentIndex = COMPLEXITY_ORDER.indexOf(current);
  const nextIndex = Math.max(
    0,
    Math.min(COMPLEXITY_ORDER.length - 1, currentIndex + delta),
  );
  return COMPLEXITY_ORDER[nextIndex];
}

export function updateSelfExpressionProfile(
  profile: SelfExpressionProfile,
  indicators: SelfExpressionIndicators,
  scenarioId: string,
): SelfExpressionProfile {
  const increaseRule = SELF_EXPRESSION_ADAPTIVE_RULES.find(
    (rule) => rule.id === "INCREASE_SCENARIO_COMPLEXITY",
  );
  const decreaseRule = SELF_EXPRESSION_ADAPTIVE_RULES.find(
    (rule) => rule.id === "SIMPLIFY_AFTER_REPEATED_INCOMPLETE",
  );

  const minRelevance = increaseRule?.condition.minScenarioRelevance ?? 1;
  const requiredDimensions = increaseRule?.condition.requiredDimensions ?? 3;
  const maxDimensionsLow = decreaseRule?.condition.maxDimensionsForLow ?? 1;
  const consecutiveSessions = decreaseRule?.condition.consecutiveSessions ?? 2;

  let nextComplexity = profile.complexity;
  let nextLowStreak = 0;

  if (
    indicators.scenarioRelevanceCount >= minRelevance &&
    indicators.completedDimensionsCount >= requiredDimensions
  ) {
    nextComplexity = changeComplexity(profile.complexity, 1);
  } else if (
    indicators.completedDimensionsCount <= maxDimensionsLow &&
    indicators.isIncompleteResponse
  ) {
    nextLowStreak = profile.lowIndicatorStreak + 1;
    if (nextLowStreak >= consecutiveSessions) {
      nextComplexity = changeComplexity(profile.complexity, -1);
      nextLowStreak = 0;
    }
  }

  return {
    ...profile,
    complexity: nextComplexity,
    lowIndicatorStreak: nextLowStreak,
    sessionsCompleted: profile.sessionsCompleted + 1,
    recentScenarioIds: [scenarioId, ...profile.recentScenarioIds]
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 3),
    updatedAt: new Date().toISOString(),
  };
}
