export type CreativityGrade = 3 | 4 | 5 | 6;
export type CreativityAgeBand = "kelas-3-4" | "kelas-5-6";
export type CreativityComplexity = "simple" | "medium" | "complex";
export type CreativityInputMode = "writing" | "speech-to-text";
export type CreativityFinishReason = "manual" | "timer";

export interface CreativityStimulusObject {
  name: string;
  keywords: string[];
  relatedTerms: string[];
}

export interface CreativityScene {
  id: string;
  title: string;
  imageSrc: string;
  ageBand: CreativityAgeBand;
  complexity: CreativityComplexity;
  setting: string;
  objects: CreativityStimulusObject[];
  objectDetectionStatus: "manual-metadata-placeholder";
}

export interface CreativityIndicators {
  mentionedObjectCount: number;
  mentionedObjects: string[];
  hasReason: boolean;
  ideaVarietyCount: number;
  wordCount: number;
  characterCount: number;
  isShortResponse: boolean;
}

export interface CreativitySessionRecord {
  schemaVersion: 1;
  sessionId: string;
  activity: "creativity";
  grade: CreativityGrade;
  ageBand: CreativityAgeBand;
  sceneId: string;
  sceneTitle: string;
  imageSrc: string;
  complexityUsed: CreativityComplexity;
  sceneObjects: string[];
  objectDetectionStatus: "manual-metadata-placeholder";
  responseText: string;
  inputModes: CreativityInputMode[];
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  assistanceCount: number;
  assistanceShown: string[];
  finishReason: CreativityFinishReason;
  indicators: CreativityIndicators;
}

export interface CreativityProfile {
  ageBand: CreativityAgeBand;
  complexity: CreativityComplexity;
  lowIndicatorStreak: number;
  sessionsCompleted: number;
  recentSceneIds: string[];
  updatedAt: string;
}
