import type {
  CreativityAgeBand,
  CreativityComplexity,
  CreativityIndicators,
  CreativityProfile,
  CreativityScene,
  CreativitySessionRecord,
  CreativityStimulusObject,
} from "@/lib/creativityTypes";

interface CreativityRuleCondition {
  elapsedSecondsAtLeast?: number;
  responseWordCountBelow?: number;
  mentionedObjectsAtLeast?: number;
  mentionedObjectsAtMost?: number;
  requiresReason?: boolean;
  ideaVarietyAtMost?: number;
  consecutiveSessions?: number;
}

interface CreativityRule {
  id: string;
  condition: CreativityRuleCondition;
  action: string;
}

// Satu tabel konfigurasi menjadi sumber aturan dan ambang adaptasi.
// Ubah angka pada condition untuk menyesuaikan perilaku sistem.
export const CREATIVITY_ADAPTIVE_RULES: CreativityRule[] = [
  {
    id: "HELP_AFTER_TWO_MINUTES",
    condition: { elapsedSecondsAtLeast: 120, responseWordCountBelow: 5 },
    action: "Tampilkan pemantik ketiga dan petunjuk ringan; assistanceCount bertambah satu.",
  },
  {
    id: "INCREASE_IMAGE_COMPLEXITY",
    condition: { mentionedObjectsAtLeast: 3, requiresReason: true },
    action: "Naikkan kompleksitas gambar satu tingkat untuk sesi berikutnya.",
  },
  {
    id: "SIMPLIFY_AFTER_REPEATED_DIFFICULTY",
    condition: {
      mentionedObjectsAtMost: 1,
      requiresReason: false,
      ideaVarietyAtMost: 1,
      consecutiveSessions: 2,
    },
    action: "Jika indikator respons rendah pada dua sesi berturut-turut, turunkan kompleksitas gambar satu tingkat.",
  },
  {
    id: "MAINTAIN_CURRENT_COMPLEXITY",
    condition: {},
    action: "Pertahankan kompleksitas gambar jika kondisi peningkatan atau penyederhanaan tidak terpenuhi.",
  },
];

const PROFILE_STORAGE_PREFIX = "cakara:creativity:profile:v1:";
const SESSION_STORAGE_KEY = "cakara:creativity:sessions:v1";
const MAX_STORED_SESSIONS = 30;
const COMPLEXITY_ORDER: CreativityComplexity[] = ["simple", "medium", "complex"];

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

export function isShortCreativityResponse(responseText: string): boolean {
  const words = responseText.trim().split(/\s+/).filter(Boolean);
  const rule = CREATIVITY_ADAPTIVE_RULES.find((item) => item.id === "HELP_AFTER_TWO_MINUTES");
  return words.length < (rule?.condition.responseWordCountBelow ?? 5);
}

export function shouldShowCreativityHelp(
  elapsedSeconds: number,
  responseText: string,
): boolean {
  const rule = CREATIVITY_ADAPTIVE_RULES.find((item) => item.id === "HELP_AFTER_TWO_MINUTES");
  const waitSeconds = rule?.condition.elapsedSecondsAtLeast ?? 120;
  return elapsedSeconds >= waitSeconds && isShortCreativityResponse(responseText);
}

export function analyzeCreativityResponse(
  responseText: string,
  scene: CreativityScene,
  stimulusObjects?: CreativityStimulusObject[],
): CreativityIndicators {
  const normalizedResponse = normalizeText(responseText);
  const words = normalizedResponse.split(/\s+/).filter(Boolean);
  const activeObjects =
    stimulusObjects && stimulusObjects.length > 0 ? stimulusObjects : scene.objects;

  const mentionedObjects = activeObjects
    .filter((object) => object.keywords.some((keyword) => containsPhrase(normalizedResponse, keyword)))
    .map((object) => object.name);

  // Kumpulkan kata terkait konteks (relatedTerms) secara terpisah tanpa menghitungnya sebagai objek langsung.
  const relatedContextTerms = Array.from(
    new Set(
      activeObjects.flatMap((object) =>
        object.relatedTerms.filter((term) => containsPhrase(normalizedResponse, term)),
      ),
    ),
  );

  const hasReason = /\b(karena|soalnya|supaya|agar|sebab|sehingga)\b/i.test(normalizedResponse);
  const hasEmotionObservation =
    /\b(senang|gembira|bahagia|ceria|sedih|kecewa|takut|marah|bingung|kagum|terkejut|antusias|semangat|ramah|nyaman|khawatir|perasaan|merasa)\b/i.test(
      normalizedResponse,
    );
  const hasFuturePrediction =
    /\b(akan|nanti|setelah|selanjutnya|kemudian|berikutnya|lalu|mungkin|sebentar lagi)\b/i.test(
      normalizedResponse,
    );

  // Heuristik ragam ide: menghitung klausa unik, bukan menilai kualitas ide.
  const clauses = normalizedResponse
    .split(/[.!?;\n]+|\b(?:atau|selain itu|kemungkinan lain|bisa juga|kemudian)\b/gi)
    .map((part) => part.trim())
    .filter((part) => part.split(/\s+/).filter(Boolean).length >= 3);

  return {
    mentionedObjectCount: mentionedObjects.length,
    mentionedObjects,
    relatedContextTerms,
    hasReason,
    hasEmotionObservation,
    hasFuturePrediction,
    ideaVarietyCount: new Set(clauses).size,
    wordCount: words.length,
    characterCount: responseText.trim().length,
    isShortResponse: isShortCreativityResponse(responseText),
  };
}

export function createDefaultCreativityProfile(ageBand: CreativityAgeBand): CreativityProfile {
  return {
    ageBand,
    complexity: "medium",
    lowIndicatorStreak: 0,
    sessionsCompleted: 0,
    recentSceneIds: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadCreativityProfile(ageBand: CreativityAgeBand): CreativityProfile {
  if (typeof window === "undefined") return createDefaultCreativityProfile(ageBand);

  try {
    const raw = window.localStorage.getItem(`${PROFILE_STORAGE_PREFIX}${ageBand}`);
    if (!raw) return createDefaultCreativityProfile(ageBand);

    const parsed = JSON.parse(raw) as Partial<CreativityProfile>;
    const validComplexity = COMPLEXITY_ORDER.includes(parsed.complexity as CreativityComplexity);

    return {
      ...createDefaultCreativityProfile(ageBand),
      ...parsed,
      ageBand,
      complexity: validComplexity ? (parsed.complexity as CreativityComplexity) : "medium",
      lowIndicatorStreak: typeof parsed.lowIndicatorStreak === "number" ? parsed.lowIndicatorStreak : 0,
      sessionsCompleted: typeof parsed.sessionsCompleted === "number" ? parsed.sessionsCompleted : 0,
      recentSceneIds: Array.isArray(parsed.recentSceneIds)
        ? parsed.recentSceneIds.filter((value): value is string => typeof value === "string")
        : [],
    };
  } catch {
    return createDefaultCreativityProfile(ageBand);
  }
}

export function saveCreativityProfile(profile: CreativityProfile): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(`${PROFILE_STORAGE_PREFIX}${profile.ageBand}`, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function saveCreativitySession(session: CreativitySessionRecord): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const previous = Array.isArray(parsed) ? (parsed as CreativitySessionRecord[]) : [];
    window.localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify([...previous, session].slice(-MAX_STORED_SESSIONS)),
    );
    return true;
  } catch {
    return false;
  }
}

export function chooseCreativityScene(
  scenes: CreativityScene[],
  profile: CreativityProfile,
): CreativityScene | null {
  const ageScenes = scenes.filter((scene) => scene.ageBand === profile.ageBand);
  if (ageScenes.length === 0) return null;

  let candidates = ageScenes.filter((scene) => scene.complexity === profile.complexity);
  if (candidates.length === 0) candidates = ageScenes;

  const notRecentlyUsed = candidates.filter((scene) => !profile.recentSceneIds.includes(scene.id));
  const finalCandidates = notRecentlyUsed.length > 0 ? notRecentlyUsed : candidates;
  return finalCandidates[Math.floor(Math.random() * finalCandidates.length)] ?? null;
}

function changeComplexity(current: CreativityComplexity, delta: -1 | 1): CreativityComplexity {
  const currentIndex = COMPLEXITY_ORDER.indexOf(current);
  const nextIndex = Math.max(0, Math.min(COMPLEXITY_ORDER.length - 1, currentIndex + delta));
  return COMPLEXITY_ORDER[nextIndex];
}

export function updateCreativityProfile(
  profile: CreativityProfile,
  indicators: CreativityIndicators,
  sceneId: string,
): CreativityProfile {
  const increaseRule = CREATIVITY_ADAPTIVE_RULES.find((rule) => rule.id === "INCREASE_IMAGE_COMPLEXITY");
  const decreaseRule = CREATIVITY_ADAPTIVE_RULES.find((rule) => rule.id === "SIMPLIFY_AFTER_REPEATED_DIFFICULTY");

  const minObjects = increaseRule?.condition.mentionedObjectsAtLeast ?? 3;
  const lowMaxObjects = decreaseRule?.condition.mentionedObjectsAtMost ?? 1;
  const lowMaxIdeas = decreaseRule?.condition.ideaVarietyAtMost ?? 1;
  const sessionsBeforeSimpler = decreaseRule?.condition.consecutiveSessions ?? 2;

  let nextComplexity = profile.complexity;
  let nextLowStreak = 0;

  // Panjang jawaban tidak pernah menjadi satu-satunya dasar adaptasi.
  if (indicators.mentionedObjectCount >= minObjects && indicators.hasReason) {
    nextComplexity = changeComplexity(profile.complexity, 1);
  } else if (
    indicators.mentionedObjectCount <= lowMaxObjects &&
    !indicators.hasReason &&
    indicators.ideaVarietyCount <= lowMaxIdeas
  ) {
    nextLowStreak = profile.lowIndicatorStreak + 1;
    if (nextLowStreak >= sessionsBeforeSimpler) {
      nextComplexity = changeComplexity(profile.complexity, -1);
      nextLowStreak = 0;
    }
  }

  return {
    ...profile,
    complexity: nextComplexity,
    lowIndicatorStreak: nextLowStreak,
    sessionsCompleted: profile.sessionsCompleted + 1,
    recentSceneIds: [sceneId, ...profile.recentSceneIds]
      .filter((value, index, array) => array.indexOf(value) === index)
      .slice(0, 3),
    updatedAt: new Date().toISOString(),
  };
}
