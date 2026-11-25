
"use client";

import { useEffect, useState } from "react";
import {
  clearActivityHistory,
  loadActivityHistory,
  type ActivityHistoryRecord,
  type ActivityType,
} from "@/lib/activityStorage";

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  knowledge: "Knowledge",
  creativity: "Creativity",
  "self-expression": "Self-Expression",
};

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  knowledge: "bi-lightbulb",
  creativity: "bi-palette",
  "self-expression": "bi-chat-square-text",
};

export default function ActivityHistory() {
  const [history, setHistory] = useState<ActivityHistoryRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

// PERBAIKAN: Memuat riwayat secara asinkron setelah komponen terpasang.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHistory(loadActivityHistory());
      setIsLoaded(true);
    }, 0);

    return () => {
        window.clearTimeout(timer);
    };
  }, []);

  function handleClearHistory() {
    const success = clearActivityHistory();

    if (success) {
      setHistory([]);
      setConfirmClear(false);
      setErrorMessage("");
    } else {
      setErrorMessage("Riwayat belum berhasil dihapus.");
    }
  }

  function formatDate(value: string) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Waktu tidak tersedia";
    }

    return date.toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  if (!isLoaded) return null;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2A7387]">
            PERKEMBANGAN BELAJAR
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#0C3846]">
            Riwayat aktivitas
          </h2>

          <p className="mt-2 text-sm leading-6 text-[#65828B]">
            Lihat kembali aktivitas dan jawaban yang telah kamu selesaikan.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmClear((previous) => !previous)}
            className="text-sm font-semibold text-red-600 transition hover:text-red-800"
          >
            Hapus riwayat
          </button>
        )}
      </div>

      {confirmClear && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-800">
            Hapus seluruh riwayat aktivitas?
          </p>

          <p className="mt-1 text-sm leading-6 text-red-700">
            Data riwayat yang tersimpan di browser ini akan dihapus.
            Tindakan ini tidak dapat dibatalkan.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClearHistory}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Ya, hapus riwayat
            </button>

            <button
              type="button"
              onClick={() => setConfirmClear(false)}
              className="rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      {history.length === 0 ? (
        <div className="mt-5 rounded-3xl border border-dashed border-[#C8DDE4] bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E4F4F8]">
            <i className="bi bi-journal-text text-2xl text-[#2A7387]" />
          </div>

          <h3 className="mt-4 font-bold text-[#0C3846]">
            Belum ada riwayat belajar
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#65828B]">
            Aktivitas yang telah selesai akan muncul di sini.
            Mulailah satu kegiatan untuk mencatat perkembangan belajarmu.
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {history.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-[#DCEBF0] bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E4F4F8]">
                    <i
                      className={`bi ${ACTIVITY_ICONS[record.activity]} text-xl text-[#2A7387]`}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-[#0C3846]">
                      {ACTIVITY_LABELS[record.activity]}
                    </h3>

                    <p className="mt-1 text-xs text-[#65828B]">
                      {formatDate(record.completedAt)}
                    </p>
                  </div>
                </div>

                {typeof record.score === "number" && (
                  <div className="rounded-xl bg-[#E4F4F8] px-4 py-2 text-right">
                    <p className="text-xs text-[#65828B]">
                      Skor
                    </p>

                    <p className="text-lg font-bold text-[#0C3846]">
                      {record.score}%
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#65828B]">
                <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5">
                  {record.responses.length} respons
                </span>

                {record.grade && (
                  <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5">
                    Kelas {record.grade}
                  </span>
                )}

                {record.category && (
                  <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5">
                    {record.category}
                  </span>
                )}

                {typeof record.correctCount === "number" && (
                  <span className="rounded-full bg-[#F1F7F9] px-3 py-1.5">
                    {record.correctCount}/{record.totalItems} benar
                  </span>
                )}
              </div>

              <details className="mt-5 border-t border-[#DCEBF0] pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#2A7387]">
                  Lihat jawaban
                </summary>

                <div className="mt-4 space-y-4">
                  {record.responses.map((response, index) => (
                    <div
                      key={`${record.id}-${index}`}
                      className="rounded-xl bg-[#F7FBFC] p-4"
                    >
                      <p className="text-xs font-bold text-[#2A7387]">
                        {response.label}
                      </p>

                      <p className="mt-2 text-sm font-semibold leading-6 text-[#0C3846]">
                        {response.prompt}
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#496C77]">
                        {response.response}
                      </p>

                      {typeof response.correct === "boolean" && (
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            response.correct
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {response.correct
                            ? "Jawaban benar"
                            : "Jawaban belum tepat"}
                        </p>
                      )}

                      {response.explanation && (
                        <p className="mt-2 text-xs leading-5 text-[#65828B]">
                          {response.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
