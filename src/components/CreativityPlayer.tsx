"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import SiteHeader from "@/components/SiteHeader";
import { CREATIVITY_SCENES, getAgeBand } from "@/data/creativityScenes";
import {
  analyzeCreativityResponse,
  chooseCreativityScene,
  loadCreativityProfile,
  saveCreativityProfile,
  saveCreativitySession,
  shouldShowCreativityHelp,
  updateCreativityProfile,
} from "@/lib/creativityAdaptation";
import { detectSceneObjects } from "@/lib/creativityVision";
import { useSpeechToText } from "@/lib/useSpeechToText";
import type {
  CreativityFinishReason,
  CreativityGrade,
  CreativityInputMode,
  CreativityObjectDetectionStatus,
  CreativityScene,
  CreativitySessionRecord,
  CreativityStimulusObject,
  DetectedVisionObject,
} from "@/lib/creativityTypes";

const TOTAL_SECONDS = 5 * 60;

const STARTER_QUESTIONS = [
  "Apa yang kamu lihat di gambar ini, dan apa yang sedang terjadi?",
  "Menurutmu, apa yang dirasakan orang atau tokoh di gambar ini, dan kenapa?",
  "Apa yang akan terjadi setelah ini?",
];

const HELPER_HINT =
  "Coba amati satu bagian gambar yang paling menarik perhatianmu. Apa yang kamu perhatikan di sana?";

function appendUniqueMode(
  current: CreativityInputMode[],
  next: CreativityInputMode,
): CreativityInputMode[] {
  return current.includes(next) ? current : [...current, next];
}

export default function CreativityPlayer() {
  const [grade, setGrade] = useState<CreativityGrade>(4);
  const [scene, setScene] = useState<CreativityScene | null>(null);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [inputMode, setInputMode] = useState<CreativityInputMode>("writing");
  const [inputModes, setInputModes] = useState<CreativityInputMode[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [helpShown, setHelpShown] = useState(false);
  const [helpCount, setHelpCount] = useState(0);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [sessionRecord, setSessionRecord] = useState<CreativitySessionRecord | null>(null);
  const [saveWarning, setSaveWarning] = useState(false);

  // State Computer Vision untuk deteksi objek otomatis dengan fallback metadata manual.
  const [visionStatus, setVisionStatus] = useState<"idle" | "detecting" | "ready">("idle");
  const [detectionStatus, setDetectionStatus] =
    useState<CreativityObjectDetectionStatus>("manual-metadata-placeholder");
  const [detectedVisionObjects, setDetectedVisionObjects] = useState<DetectedVisionObject[]>([]);
  const [activeSceneObjects, setActiveSceneObjects] = useState<CreativityStimulusObject[]>([]);

  const finishedRef = useRef(false);
  const ageBand = useMemo(() => getAgeBand(grade), [grade]);
  const isLowerGrade = grade <= 4;
  const responseWordCount = responseText.trim().split(/\s+/).filter(Boolean).length;
  const timerProgress = Math.min(100, (elapsedSeconds / TOTAL_SECONDS) * 100);

  // Gunakan hook Speech-to-Text bersama agar mendukung interim transcript dan penanganan error izin mikrofon.
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
      setInputModes((previous) => appendUniqueMode(previous, "speech-to-text"));
    },
    onFallbackToText: () => {
      setInputMode("writing");
    },
  });

  const stopListening = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  const finishSession = useCallback(
    (finishReason: CreativityFinishReason) => {
      if (!scene || !startedAt || finishedRef.current) return;
      finishedRef.current = true;
      stopListening();

      const completedAt = new Date();
      const elapsedFromStart = Math.floor(
        (completedAt.getTime() - new Date(startedAt).getTime()) / 1000,
      );
      const durationSeconds = Math.max(
        0,
        Math.min(TOTAL_SECONDS, elapsedFromStart || elapsedSeconds),
      );

      const effectiveObjects =
        activeSceneObjects.length > 0 ? activeSceneObjects : scene.objects;
      const indicators = analyzeCreativityResponse(
        responseText,
        scene,
        effectiveObjects,
      );
      const currentProfile = loadCreativityProfile(ageBand);
      const updatedProfile = updateCreativityProfile(
        currentProfile,
        indicators,
        scene.id,
      );

      const session: CreativitySessionRecord = {
        schemaVersion: 1,
        sessionId:
          typeof window !== "undefined" && window.crypto?.randomUUID
            ? window.crypto.randomUUID()
            : `creativity-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        activity: "creativity",
        grade,
        ageBand,
        sceneId: scene.id,
        sceneTitle: scene.title,
        imageSrc: scene.imageSrc,
        complexityUsed: scene.complexity,
        sceneObjects: effectiveObjects.map((object) => object.name),
        detectedVisionObjects,
        objectDetectionStatus: detectionStatus,
        responseText: responseText.trim(),
        inputModes,
        startedAt,
        completedAt: completedAt.toISOString(),
        durationSeconds,
        assistanceCount: helpCount,
        assistanceShown: helpShown ? ["prompt-3-after-two-minutes"] : [],
        finishReason,
        indicators,
      };

      const sessionSaved = saveCreativitySession(session);
      const profileSaved = saveCreativityProfile(updatedProfile);
      setSessionRecord(session);
      setSaveWarning(!sessionSaved || !profileSaved);
      setFinished(true);
    }, [
      activeSceneObjects,
      ageBand,
      detectedVisionObjects,
      detectionStatus,
      elapsedSeconds,
      grade,
      helpCount,
      helpShown,
      inputModes,
      responseText,
      scene,
      startedAt,
      stopListening,
    ],
  );

  // PERBAIKAN: Timer dihitung dari waktu mulai agar tidak bergeser
  // jika tab browser sempat berada di latar belakang.
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
  }, [started, finished, startedAt]);

  // Bantuan muncul setelah dua menit hanya jika respons belum ada atau masih pendek.
  // Callback terjadwal menghindari perubahan state sinkron saat effect dijalankan.
  useEffect(() => {
    if (!started || finished || helpShown) return;
    if (!shouldShowCreativityHelp(elapsedSeconds, responseText)) return;

    const helpTimer = window.setTimeout(() => {
      setHelpShown(true);
      setHelpCount((previous) => previous + 1);
    }, 0);

    return () => window.clearTimeout(helpTimer);
  }, [elapsedSeconds, finished, helpShown, responseText, started]);

  // Waktu habis menyelesaikan sesi tanpa menghapus respons atau memberi status gagal.
  useEffect(() => {
    if (started && !finished && elapsedSeconds >= TOTAL_SECONDS) {
      finishSession("timer");
    }
  }, [elapsedSeconds, finishSession, finished, started]);

  // Jalankan Computer Vision secara non-blocking saat ilustrasi sesi aktif.
  useEffect(() => {
    if (!started || finished || !scene) return;

    let cancelled = false;

    detectSceneObjects(scene).then((result) => {
      if (cancelled) return;
      setDetectedVisionObjects(result.detectedObjects);
      setActiveSceneObjects(result.mergedObjects);
      setDetectionStatus(result.status);
      setVisionStatus("ready");
    });

    return () => {
      cancelled = true;
    };
  }, [finished, scene, started]);

  function startSession() {
    const profile = loadCreativityProfile(ageBand);
    const selectedScene = chooseCreativityScene(CREATIVITY_SCENES, profile);

    if (!selectedScene) return;

    finishedRef.current = false;
    setScene(selectedScene);
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
    setVisionStatus("detecting");
    setDetectionStatus(selectedScene.objectDetectionStatus);
    setDetectedVisionObjects([]);
    setActiveSceneObjects(selectedScene.objects);
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
      setInputModes((previous) => appendUniqueMode(previous, "speech-to-text"));
    } else {
      setInputMode("writing");
    }
  }

  function chooseWritingMode() {
    stopListening();
    setInputMode("writing");
    resetSpeechMessages();
  }

  function resetSession() {
    stopListening();
    setScene(null);
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
    setVisionStatus("idle");
    setDetectionStatus("manual-metadata-placeholder");
    setDetectedVisionObjects([]);
    setActiveSceneObjects([]);
    finishedRef.current = false;
  }

  const childFeedback = responseText.trim()
    ? "Wah, idemu menarik! Kamu boleh menambahkan bagian lain kalau masih punya ide."
    : "Tidak apa-apa. Kamu boleh mencoba menulis atau berbicara kapan saja.";

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
              <i className="bi bi-palette text-2xl text-[#2A7387]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-[#2A7387]">AKTIVITAS 02</p>
              <h1 className="text-2xl font-bold text-[#0C3846] sm:text-3xl">Creativity</h1>
              <p className="mt-1 text-sm text-[#65828B]">Temukan ide dari sebuah gambar.</p>
            </div>
          </header>

          {!started && !finished && (
            <div className="mt-7 rounded-2xl bg-[#F7FBFC] p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <i className="bi bi-stars text-2xl text-[#94651B]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-[#0C3846]">
                  {isLowerGrade ? "Ayo, mulai petualangan ide!" : "Amati dan temukan kemungkinan."}
                </h2>
              </div>
              <p className="mt-2 text-sm leading-6 text-[#65828B]">
                {isLowerGrade
                  ? "Lihat satu gambar, lalu ceritakan apa yang kamu bayangkan."
                  : "Amati satu situasi dan bagikan tafsiran atau kemungkinan yang terpikir olehmu."}
              </p>

              <label htmlFor="creativity-grade" className="mt-5 block text-sm font-semibold text-[#0C3846]">
                Kamu kelas berapa?
              </label>
              <select
                id="creativity-grade"
                value={grade}
                onChange={(event: ChangeEvent<HTMLSelectElement>) => setGrade(Number(event.target.value) as CreativityGrade)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#DCEBF0] bg-white px-4 text-base text-[#173B46] outline-none focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
              >
                {[3, 4, 5, 6].map((value) => (
                  <option key={value} value={value}>Kelas {value}</option>
                ))}
              </select>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#DCEBF0] bg-white p-4">
                  <i className="bi bi-image text-xl text-[#2A7387]" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-[#0C3846]">Satu gambar</p>
                  <p className="mt-1 text-xs leading-5 text-[#65828B]">Amati dengan caramu sendiri.</p>
                </div>
                <div className="rounded-xl border border-[#DCEBF0] bg-white p-4">
                  <i className="bi bi-mic text-xl text-[#2A7387]" aria-hidden="true" />
                  <p className="mt-2 text-sm font-semibold text-[#0C3846]">Bicara atau menulis</p>
                  <p className="mt-1 text-xs leading-5 text-[#65828B]">Pilih cara yang paling nyaman.</p>
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

          {started && !finished && scene && (
            <div className="mt-7">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-[#0C3846]">
                  {isLowerGrade ? "Petualangan ide" : "Amati situasi ini"}
                </p>
                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5 text-xs font-semibold text-[#65828B]">
                  5 menit
                </span>
              </div>

              {/* Satu ilustrasi dipilih sekali ketika sesi dimulai. */}
              <div className="mt-4 overflow-hidden rounded-2xl border border-[#DCEBF0] bg-[#EAF5F7]">
                <Image
                  src={scene.imageSrc}
                  alt={`Ilustrasi suasana ${scene.setting}`}
                  width={1200}
                  height={680}
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                  className="h-auto w-full object-cover"
                />
              </div>

              {/* Status Computer Vision non-spoiler agar tidak membocorkan daftar objek ke siswa. */}
              <p className="mt-2 flex items-center gap-2 text-xs text-[#65828B]" aria-live="polite">
                <i className="bi bi-eye text-[#2A7387]" aria-hidden="true" />
                {visionStatus === "detecting"
                  ? "Menyiapkan pengenalan objek gambar..."
                  : detectedVisionObjects.length > 0
                    ? `Gambar siap diamati (${detectedVisionObjects.length} deteksi visual otomatis + referensi adegan).`
                    : "Gambar siap diamati (menggunakan referensi adegan bawaan)."}
              </p>

              {/* Timer hanya berupa progress bar, tanpa alarm atau indikator merah. */}
              <div className="mt-5 rounded-xl bg-[#F7FBFC] p-4">
                <div className="mb-2 flex items-center justify-between text-xs font-semibold text-[#65828B]">
                  <span className="flex items-center gap-2">
                    <i className="bi bi-hourglass-split text-[#2A7387]" aria-hidden="true" />
                    Waktu bermain
                  </span>
                  <span>{Math.max(0, TOTAL_SECONDS - elapsedSeconds) > 0 ? "Teruskan dengan santai" : "Sesi selesai"}</span>
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

              {/* Dua pemantik pertama selalu muncul sejak awal sesi. */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {STARTER_QUESTIONS.slice(0, 2).map((question, index) => (
                  <div key={question} className="rounded-2xl border border-[#DCEBF0] bg-white p-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#E4F4F8] text-sm font-bold text-[#2A7387]">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#65828B]">Pertanyaan pemantik</span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-[#173B46]">{question}</p>
                  </div>
                ))}
              </div>

              {helpShown && (
                <div className="mt-4 rounded-2xl border border-[#DCEBF0] bg-[#FFF8E8] p-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#76551B]">
                    <i className="bi bi-lightbulb" aria-hidden="true" />
                    Satu ide tambahan
                  </div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#655638]">{STARTER_QUESTIONS[2]}</p>
                  <p className="mt-2 text-sm leading-6 text-[#806D48]">{HELPER_HINT}</p>
                </div>
              )}

              <div className="mt-6">
                <h2 className="text-base font-bold text-[#0C3846]">Bagikan idemu</h2>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={chooseWritingMode}
                    aria-pressed={inputMode === "writing"}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${inputMode === "writing" ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]" : "border-[#DCEBF0] bg-white text-[#65828B]"}`}
                  >
                    <i className="bi bi-pencil-square text-lg" aria-hidden="true" />
                    Menulis
                  </button>
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startSpeechToText}
                    aria-pressed={inputMode === "speech-to-text"}
                    className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-bold transition ${inputMode === "speech-to-text" ? "border-[#2A7387] bg-[#E4F4F8] text-[#0C3846]" : "border-[#DCEBF0] bg-white text-[#65828B]"}`}
                  >
                    <i className={`bi ${isListening ? "bi-mic-fill" : "bi-mic"} text-lg`} aria-hidden="true" />
                    {isListening ? "Berhenti bicara" : "Bicara"}
                  </button>
                </div>

                <label htmlFor="creativity-response" className="mt-4 block text-sm font-semibold text-[#0C3846]">
                  {inputMode === "speech-to-text" ? "Hasil ucapanmu" : "Tulis idemu di sini"}
                </label>
                <textarea
                  id="creativity-response"
                  value={responseText}
                  onChange={(event: ChangeEvent<HTMLTextAreaElement>) => handleTextChange(event.target.value)}
                  maxLength={3000}
                  rows={6}
                  placeholder="Aku melihat..., lalu mungkin..."
                  className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-[#DCEBF0] bg-white p-4 text-base leading-7 text-[#173B46] outline-none placeholder:text-[#9AB0B7] focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#65828B]">
                  <span>{responseWordCount > 0 ? "Jawabanmu tersimpan sementara selama sesi." : "Tidak ada jawaban benar atau salah."}</span>
                  <span>{responseText.length}/3000</span>
                </div>

                <p className="mt-3 text-xs leading-5 text-[#8199A1]">
                  Ucapan diubah menjadi teks (Bahasa Indonesia). CARAKA tidak menyimpan rekaman suara.
                </p>

                {interimTranscript && (
                  <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#65828B]">
                    <strong>Transkripsi sementara:</strong> {interimTranscript}
                  </p>
                )}

                {speechStatusMessage && (
                  <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#496C77]" role="status">
                    {speechStatusMessage}
                  </p>
                )}

                {speechErrorMessage && (
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700" role="alert">
                    {speechErrorMessage}
                  </p>
                )}

                {responseWordCount > 0 && (
                  <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#496C77]">
                    {childFeedback}
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
                <i className="bi bi-stars text-3xl text-[#94651B]" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-[#0C3846]">
                Terima kasih sudah berbagi ide!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[#65828B]">
                {responseText.trim()
                  ? "Wah, idemu menarik! Setiap orang bisa melihat sesuatu dengan cara yang berbeda."
                  : "Terima kasih sudah mencoba. Kamu boleh kembali dan berbagi ide kapan saja."}
              </p>
              {saveWarning && (
                <p className="mt-4 rounded-xl border border-[#E7D6A9] bg-[#FFF8E8] p-3 text-sm leading-6 text-[#76551B]" role="alert">
                  Data sesi atau profil belajar belum berhasil disimpan pada perangkat ini. Jawaban masih terlihat selama halaman ini terbuka.
                </p>
              )}
              {sessionRecord && (
                <p className="mt-3 text-xs text-[#65828B]">
                  Waktu kegiatan: {Math.floor(sessionRecord.durationSeconds / 60)} menit {sessionRecord.durationSeconds % 60} detik.
                </p>
              )}
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetSession}
                  className="min-h-12 rounded-xl bg-[#0C3846] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2A7387]"
                >
                  Mulai gambar baru
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
