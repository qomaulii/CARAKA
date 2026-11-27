export type SelfExpressionGrade = 3 | 4 | 5 | 6;
export type SelfExpressionAgeBand = "kelas-3-4" | "kelas-5-6";
export type SelfExpressionComplexity = "simple" | "medium" | "complex";
export type SelfExpressionInputMode = "writing" | "speech-to-text";
export type SelfExpressionFinishReason = "manual" | "timer";

export interface SelfExpressionScenario {
  id: string;
  title: string;
  ageBand: SelfExpressionAgeBand;
  complexity: SelfExpressionComplexity;
  situation: string;
  questions: [string, string, string];
  scenarioKeywords: string[];
  guidancePrompts: string[];
}

export interface SelfExpressionIndicators {
  matchedScenarioTerms: string[];
  scenarioRelevanceCount: number;
  hasFeelingExpression: boolean;
  hasOpinionExpression: boolean;
  hasActionChoice: boolean;
  hasReason: boolean;
  // Jumlah ini tetap memakai tiga kelompok adaptasi: perasaan/opini, tindakan, dan alasan.
  completedDimensionsCount: number;
  wordCount: number;
  characterCount: number;
  isIncompleteResponse: boolean;
}

export interface SelfExpressionSessionRecord {
  schemaVersion: 1;
  sessionId: string;
  activity: "self-expression";
  grade: SelfExpressionGrade;
  ageBand: SelfExpressionAgeBand;
  scenarioId: string;
  scenarioTitle: string;
  complexityUsed: SelfExpressionComplexity;
  responseText: string;
  inputModes: SelfExpressionInputMode[];
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  assistanceCount: number;
  assistanceShown: string[];
  finishReason: SelfExpressionFinishReason;
  indicators: SelfExpressionIndicators;
}

export interface SelfExpressionProfile {
  ageBand: SelfExpressionAgeBand;
  complexity: SelfExpressionComplexity;
  lowIndicatorStreak: number;
  sessionsCompleted: number;
  recentScenarioIds: string[];
  updatedAt: string;
}
