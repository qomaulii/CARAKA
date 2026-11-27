"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import SiteHeader from "@/components/SiteHeader";
import {
  SELF_EXPRESSION_SCENARIOS,
  getSelfExpressionAgeBand,
} from "@/data/selfExpressionScenarios";
import { saveActivityHistory } from "@/lib/activityStorage";
import {
  analyzeSelfExpressionResponse,
  chooseSelfExpressionScenario,
  loadSelfExpressionProfile,
  saveSelfExpressionProfile,
  saveSelfExpressionSession,
  shouldShowSelfExpressionHelp,
  updateSelfExpressionProfile,
} from "@/lib/selfExpressionAdaptation";
import type {
  SelfExpressionFinishReason,
  SelfExpressionGrade,
  SelfExpressionInputMode,
  SelfExpressionScenario,
  SelfExpressionSessionRecord,
} from "@/lib/selfExpressionTypes";
import { useSpeechToText } from "@/lib/useSpeechToText";

const TOTAL_SECONDS = 5 * 60;

function appendUniqueMode(
  current: SelfExpressionInputMode[],
  next: SelfExpressionInputMode,
): SelfExpressionInputMode[] {
  return current.includes(next) ? current : [...current, next];
}

export default function SelfExpressionPlayer() {
  const [grade, setGrade] = useState<SelfExpressionGrade>(4);
  const [scenario, setScenario] = useState<SelfExpressionScenario | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [inputMode, setInputMode] =
    useState<SelfExpressionInputMode>("writing");
  const [inputModes, setInputModes] = useState<SelfExpressionInputMode[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [helpShown, setHelpShown] = useState(false);
  const [helpCount, setHelpCount] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionRecord, setSessionRecord] =
    useState<SelfExpressionSessionRecord | null>(null);
  const [saveWarning, setSaveWarning] = useState(false);

  const finishedRef = useRef(false);
  const ageBand = useMemo(() => getSelfExpressionAgeBand(grade), [grade]);
  const isLowerGrade = grade <= 4;
  const responseWordCount = responseText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  const timerProgress = Math.min(100, (elapsedSeconds / TOTAL_SECONDS) * 100);

  const liveIndicators = useMemo(
    () =>
      scenario ? analyzeSelfExpressionResponse(responseText, scenario) : null,
    [responseText, scenario],
  );

  const {
    isListening,
    interimTranscript,
    statusMessage: speechStatusMessage,
    errorMessage: speechErrorMessage,
    startRecording,
    stopRecording,
    resetMessages: resetSpeechMessages,
  } = useSpeechToText({
    value: responseText,
    onChange: setResponseText,
    maxLength: 3000,
    onFinalTranscript: () => {
      setInputModes((previous) =>
        appendUniqueMode(previous, "speech-to-text"),
      );
    },
    onFallbackToText: () => {
      setInputMode("writing");
    },
  });

  const finishSession = useCallback(
    (finishReason: SelfExpressionFinishReason) => {
      if (!scenario || !startedAt || finishedRef.current) return;
      finishedRef.current = true;
      stopRecording();

      const completedAt = new Date();
      const elapsedFromStart = Math.floor(
        (completedAt.getTime() - new Date(startedAt).getTime()) / 1000,
      );
      const durationSeconds = Math.max(
        0,
        Math.min(TOTAL_SECONDS, elapsedFromStart || elapsedSeconds),
      );

      const indicators = analyzeSelfExpressionResponse(responseText, scenario);
      const currentProfile = loadSelfExpressionProfile(ageBand);
      const updatedProfile = updateSelfExpressionProfile(
        currentProfile,
        indicators,
        scenario.id,
      );

      const session: SelfExpressionSessionRecord = {
        schemaVersion: 1,
        sessionId:
          typeof window !== "undefined" && window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `self-expression-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        activity: "self-expression",
        grade,
        ageBand,
        scenarioId: scenario.id,
        scenarioTitle: scenario.title,
        complexityUsed: scenario.complexity,
        responseText: responseText.trim(),
        inputModes,
        startedAt,
        completedAt: completedAt.toISOString(),
        durationSeconds,
        assistanceCount: helpCount,
        assistanceShown: helpShown ? ["guidance-prompts"] : [],
        finishReason,
        indicators,
      };

      const sessionSaved = saveSelfExpressionSession(session);
      const profileSaved = saveSelfExpressionProfile(updatedProfile);
      const historySaved = saveActivityHistory({
        activity: "self-expression",
        completedAt: session.completedAt,
        totalItems: 1,
        grade,
        responses: [
          {
            label: `Skenario: ${scenario.title}`,
            prompt: `${scenario.situation}\n\n${scenario.questions.join(" ")}`,
            response:
              responseText.trim() || "(Belum ada jawaban yang dituliskan)",
          },
        ],
      });

      setSessionRecord(session);
      setSaveWarning(!sessionSaved || !profileSaved || !historySaved);
      setFinished(true);
    },
    [
      ageBand,
      elapsedSeconds,
      grade,
      helpCount,
      helpShown,
      inputModes,
      responseText,
      scenario,
      startedAt,
      stopRecording,
    ],
  );

  // Timer berbasis selisih waktu mulai agar akurat meski tab sempat tidak aktif.
  useEffect(() => {
    if (!started || finished || !startedAt) return;

    const updateElapsedTime = () => {
      const elapsed = Math.floor(
        (Date.now() - new Date(startedAt).getTime()) / 1000,
      );
      setElapsedSeconds(Math.max(0, Math.min(TOTAL_SECONDS, elapsed)));
    };

    const timerId = window.setInterval(updateElapsedTime, 1000);
    return () => window.clearInterval(timerId);
  }, [finished, started, startedAt]);

  // Tampilkan pertanyaan pemandu secara adaptif bila respons belum memadai setelah 90 detik.
  useEffect(() => {
    if (!started || finished || helpShown || !scenario) return;
    if (!shouldShowSelfExpressionHelp(elapsedSeconds, responseText, scenario)) {
      return;
    }

    const helpTimer = window.setTimeout(() => {
      setHelpShown(true);
      setHelpCount((previous) => previous + 1);
    }, 0);

    return () => window.clearTimeout(helpTimer);
  }, [elapsedSeconds, finished, helpShown, responseText, scenario, started]);

  useEffect(() => {
    if (started && !finished && elapsedSeconds >= TOTAL_SECONDS) {
      finishSession("timer");
    }
  }, [elapsedSeconds, finishSession, finished, started]);

  function startSession() {
    const profile = loadSelfExpressionProfile(ageBand);
    const selectedScenario = chooseSelfExpressionScenario(
      SELF_EXPRESSION_SCENARIOS,
      profile,
    );

    if (!selectedScenario) return;

    finishedRef.current = false;
    setScenario(selectedScenario);
    setStartedAt(new Date().toISOString());
    setElapsedSeconds(0);
    setResponseText("");
    setInputMode("writing");
    setInputModes([]);
    resetSpeechMessages();
    setHelpShown(false);
    setHelpCount(0);
    setSessionRecord(null);
    setSaveWarning(false);
    setFinished(false);
    setStarted(true);
  }

  function handleTextChange(value: string) {
    setResponseText(value);
    if (value.trim()) {
      setInputModes((previous) => appendUniqueMode(previous, "writing"));
    }
  }

  function startSpeechToText() {
    const startedListening = startRecording();
    if (startedListening) {
      setInputMode("speech-to-text");
      setInputModes((previous) =>
        appendUniqueMode(previous, "speech-to-text"),
      );
    } else {
      setInputMode("writing");
    }
  }

  function chooseWritingMode() {
    stopRecording();
    setInputMode("writing");
    resetSpeechMessages();
  }

  function showGuidanceManually() {
    if (!helpShown) {
      setHelpShown(true);
      setHelpCount((previous) => previous + 1);
    }
  }

  function resetSession() {
    stopRecording();
    setScenario(null);
    setStarted(false);
    setFinished(false);
    setResponseText("");
    setInputMode("writing");
    setInputModes([]);
    resetSpeechMessages();
    setElapsedSeconds(0);
    setHelpShown(false);
    setHelpCount(0);
    setStartedAt(null);
    setSessionRecord(null);
    setSaveWarning(false);
    finishedRef.current = false;
  }

  return (
    <main className="min-h-screen bg-[#F7FBFC]">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-8 sm:py-10">
        <Link
          href="/aktivitas"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#65828B] transition hover:text-[#0C3846]"
        >
          <i className="bi bi-arrow-left" aria-hidden="true" />
          Kembali ke aktivitas
        </Link>

        <div className="mt-5 rounded-3xl border border-[#DCEBF0] bg-white p-5 sm:p-8">
          <header className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#E4F4F8]">
              <i
                className="bi bi-chat-square-text text-2xl text-[#2A7387]"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[#2A7387]">
                AKTIVITAS 03
              </p>
              <h1 className="text-2xl font-bold text-[#0C3846] sm:text-3xl">
                Self-Expression
              </h1>
              <p className="mt-1 text-sm text-[#65828B]">
                Sampaikan pendapat, perasaan, pilihan tindakan, dan alasanmu.
              </p>
            </div>
          </header>

          {!started && !finished && (
            <div className="mt-7 rounded-2xl bg-[#F7FBFC] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <i
                  className="bi bi-chat-heart text-2xl text-[#2A7387]"
                  aria-hidden="true"
                />
                <h2 className="text-lg font-bold text-[#0C3846]">
                  {isLowerGrade
                    ? "Yuk, ceritakan pendapatmu!"
                    : "Sampaikan pendapat dan alasanmu."}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                Kamu akan membaca satu situasi sehari-hari, lalu menjawab
                pertanyaan tentang perasaan, pilihan tindakan, dan alasanmu.
                Tidak ada jawaban benar atau salah untuk pendapatmu.
              </p>

              <label
                htmlFor="se-grade"
                className="mt-5 block text-sm font-semibold text-[#0C3846]"
              >
                Kamu kelas berapa?
              </label>
              <select
                id="se-grade"
                value={grade}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setGrade(Number(event.target.value) as SelfExpressionGrade)
                }
                className="mt-2 min-h-12 w-full rounded-xl border border-[#DCEBF0] bg-white px-4 text-base text-[#173B46] outline-none focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
              >
                {[3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>
                    Kelas {value}
                  </option>
                ))}
              </select>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DCEBF0] bg-white p-4">
                  <i
                    className="bi bi-journal-text text-xl text-[#2A7387]"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm font-semibold text-[#0C3846]">
                    Satu situasi nyata
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#65828B]">
                    Ceritakan perasaan, tindakan, dan alasanmu.
                  </p>
                </div>
                <div className="rounded-xl border border-[#DCEBF0] bg-white p-4">
                  <i
                    className="bi bi-mic text-xl text-[#2A7387]"
                    aria-hidden="true"
                  />
                  <p className="mt-2 text-sm font-semibold text-[#0C3846]">
                    Bicara atau menulis
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#65828B]">
                    Pilih cara yang paling nyaman untukmu.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={startSession}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#0C3846] px-6 py-3 text-base font-bold text-white transition hover:bg-[#2A7387] sm:w-auto"
              >
                Mulai aktivitas
                <i className="bi bi-arrow-right" aria-hidden="true" />
              </button>
            </div>
          )}

          {started && !finished && scenario && (
            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#0C3846]">
                  Pendapat dan alasan pribadi
                </p>
                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs font-semibold text-[#65828B]">
                  5 menit
                </span>
              </div>

              {/* Kartu situasi kehidupan sehari-hari */}
              <div className="mt-4 rounded-3xl bg-[#FFF3D9] p-6 sm:p-7">
                <p className="text-xs font-bold tracking-wide text-[#94651B]">
                  SITUASI
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#0C3846] sm:text-2xl">
                  {scenario.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#655638] sm:text-base">
                  {scenario.situation}
                </p>
              </div>

              {/* Timer progress santai */}
              <div className="mt-5 rounded-xl bg-[#F7FBFC] p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#65828B]">
                  <span className="flex items-center gap-2">
                    <i
                      className="bi bi-hourglass-split text-[#2A7387]"
                      aria-hidden="true"
                    />
                    Waktu bercerita
                  </span>
                  <span>
                    {Math.max(0, TOTAL_SECONDS - elapsedSeconds) > 0
                      ? "Sampaikan pendapatmu dengan tenang"
                      : "Sesi selesai"}
                  </span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-[#DCEBF0]"
                  role="progressbar"
                  aria-label="Waktu aktivitas yang telah digunakan"
                  aria-valuemin={0}
                  aria-valuemax={TOTAL_SECONDS}
                  aria-valuenow={elapsedSeconds}
                >
                  <div
                    className="h-full rounded-full bg-[#5AA6B8] transition-[width] duration-1000 ease-linear"
                    style={{ width: `${timerProgress}%` }}
                  />
                </div>
              </div>

              {/* Tiga pertanyaan opini sesuai konsep Self-Expression */}
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {scenario.questions.map((question, index) => (
                  <div
                    key={question}
                    className="rounded-2xl border border-[#DCEBF0] bg-white p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF3D9] text-sm font-bold text-[#94651B]">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#65828B]">
                        Pertanyaan
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#173B46]">
                      {question}
                    </p>
                  </div>
                ))}
              </div>

              {!helpShown && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={showGuidanceManually}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#2A7387] transition hover:text-[#0C3846]"
                  >
                    <i className="bi bi-lightbulb" aria-hidden="true" />
                    Butuh pertanyaan pemandu?
                  </button>
                </div>
              )}

              {helpShown && (
                <div className="mt-4 rounded-2xl border border-[#DCEBF0] bg-[#FFF8E8] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#76551B]">
                    <i className="bi bi-lightbulb" aria-hidden="true" />
                    Pertanyaan pemandu
                  </div>
                  <ul className="mt-2 space-y-1.5 text-sm leading-6 text-[#655638]">
                    {scenario.guidancePrompts.map((prompt) => (
                      <li key={prompt}>• {prompt}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6">
                <h2 className="text-base font-bold text-[#0C3846]">
                  Sampaikan pendapatmu
                </h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={chooseWritingMode}
                    aria-pressed={inputMode === "writing"}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      inputMode === "writing"
                        ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]"
                        : "border-[#DCEBF0] bg-white text-[#65828B]"
                    }`}
                  >
                    <i className="bi bi-pencil-square text-lg" aria-hidden="true" />
                    Menulis
                  </button>
                  <button
                    type="button"
                    onClick={isListening ? stopRecording : startSpeechToText}
                    aria-pressed={inputMode === "speech-to-text"}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${
                      inputMode === "speech-to-text"
                        ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]"
                        : "border-[#DCEBF0] bg-white text-[#65828B]"
                    }`}
                  >
                    <i
                      className={`bi ${isListening ? "bi-mic-fill" : "bi-mic"} text-lg`}
                      aria-hidden="true"
                    />
                    {isListening ? "Berhenti bicara" : "Bicara"}
                  </button>
                </div>

                <label
                  htmlFor="self-expression-response"
                  className="mt-4 block text-sm font-semibold text-[#0C3846]"
                >
                  {inputMode === "speech-to-text"
                    ? "Hasil ucapanmu"
                    : "Tulis pendapat dan alasanmu di sini"}
                </label>
                <textarea
                  id="self-expression-response"
                  value={responseText}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                    handleTextChange(event.target.value)
                  }
                  maxLength={3000}
                  rows={6}
                  placeholder="Menurutku anak itu merasa..., aku akan..., karena..."
                  className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-[#DCEBF0] bg-white p-4 text-base leading-7 text-[#173B46] outline-none placeholder:text-[#9AB0B7] focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#65828B]">
                  <span>
                    Tidak ada jawaban benar atau salah untuk pendapat pribadimu.
                  </span>
                  <span>{responseText.length}/3000</span>
                </div>

                {/* Petunjuk kelengkapan ringan tanpa menghakimi isi pendapat */}
                {liveIndicators && responseWordCount > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span
                      className={`rounded-full px-3 py-1 ${
                        liveIndicators.hasFeelingExpression
                          ? "bg-[#E9F7EF] text-[#24734A]"
                          : "bg-[#F1F7F9] text-[#65828B]"
                      }`}
                    >
                      {liveIndicators.hasFeelingExpression ? "✓ " : ""}Perasaan
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        liveIndicators.hasOpinionExpression
                          ? "bg-[#E9F7EF] text-[#24734A]"
                          : "bg-[#F1F7F9] text-[#65828B]"
                      }`}
                    >
                      {liveIndicators.hasOpinionExpression ? "✓ " : ""}Pendapat
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        liveIndicators.hasActionChoice
                          ? "bg-[#E9F7EF] text-[#24734A]"
                          : "bg-[#F1F7F9] text-[#65828B]"
                      }`}
                    >
                      {liveIndicators.hasActionChoice ? "✓ " : ""}Pilihan tindakan
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 ${
                        liveIndicators.hasReason
                          ? "bg-[#E9F7EF] text-[#24734A]"
                          : "bg-[#F1F7F9] text-[#65828B]"
                      }`}
                    >
                      {liveIndicators.hasReason ? "✓ " : ""}Alasan
                    </span>
                  </div>
                )}

                <p className="mt-3 text-xs leading-5 text-[#8199A1]">
                  Ucapan diubah menjadi teks (Bahasa Indonesia). CARAKA tidak
                  menyimpan rekaman suara.
                </p>

                {interimTranscript && (
                  <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#65828B]">
                    <strong>Transkripsi sementara:</strong>{" "}
                    {interimTranscript}
                  </p>
                )}

                {speechStatusMessage && (
                  <p
                    className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#496C77]"
                    role="status"
                  >
                    {speechStatusMessage}
                  </p>
                )}

                {speechErrorMessage && (
                  <p
                    className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
                    role="alert"
                  >
                    {speechErrorMessage}
                  </p>
                )}
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => finishSession("manual")}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#0C3846] px-7 py-3 text-base font-bold text-white transition hover:bg-[#2A7387]"
                >
                  <i className="bi bi-check-circle" aria-hidden="true" />
                  Selesai
                </button>
              </div>
            </div>
          )}

          {finished && (
            <div className="mt-8 rounded-3xl bg-[#F1F7F9] p-6 text-center sm:p-9">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white">
                <i
                  className="bi bi-chat-heart text-3xl text-[#2A7387]"
                  aria-hidden="true"
                />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[#0C3846]">
                Terima kasih sudah menyampaikan pendapatmu!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#65828B]">
                {responseText.trim()
                  ? "Pendapat dan alasanmu sangat berarti. Tidak ada jawaban benar atau salah dalam berbagi pandangan pribadi."
                  : "Terima kasih sudah mencoba. Kamu boleh kembali dan menyampaikan pendapatmu kapan saja."}
              </p>

              {saveWarning && (
                <p
                  className="mt-4 rounded-xl border border-[#E7D6A9] bg-[#FFF8E8] p-3 text-sm leading-6 text-[#76551B]"
                  role="alert"
                >
                  Data sesi atau profil belajar belum berhasil disimpan pada
                  perangkat ini. Jawaban masih terlihat selama halaman ini
                  terbuka.
                </p>
              )}

              {sessionRecord && (
                <div className="mx-auto mt-5 max-w-xl rounded-2xl border border-[#DCEBF0] bg-white p-5 text-left">
                  <p className="text-xs font-bold text-[#2A7387]">
                    RINGKASAN PENDAPATMU
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#496C77]">
                    {sessionRecord.responseText ||
                      "Belum ada jawaban yang dituliskan."}
                  </p>
                  <p className="mt-3 text-xs text-[#65828B]">
                    Waktu kegiatan:{" "}
                    {Math.floor(sessionRecord.durationSeconds / 60)} menit{" "}
                    {sessionRecord.durationSeconds % 60} detik.
                  </p>
                </div>
              )}

              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetSession}
                  className="min-h-12 rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2A7387]"
                >
                  Mulai skenario baru
                </button>
                <Link
                  href="/aktivitas"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#DCEBF0] bg-white px-6 py-3 text-sm font-bold text-[#0C3846] transition hover:border-[#9FD3E3]"
                >
                  Aktivitas lain
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="border-t border-[#DCEBF0] px-5 py-6 text-center text-sm text-[#65828B]">
        © 2026 CARAKA. Ruang belajar kreatif.
      </footer>
    </main>
  );
}
