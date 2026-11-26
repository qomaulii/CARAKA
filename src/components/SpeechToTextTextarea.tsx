"use client";

import { useSpeechToText } from "@/lib/useSpeechToText";

interface SpeechToTextTextareaProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
  maxLength?: number;
}

export default function SpeechToTextTextarea({
  id,
  value,
  onChange,
  placeholder,
  rows = 7,
  maxLength = 2000,
}: SpeechToTextTextareaProps) {
  const {
    isListening,
    interimTranscript,
    statusMessage,
    errorMessage,
    startRecording,
    stopRecording,
  } = useSpeechToText({
    value,
    onChange,
    maxLength,
  });

  return (
    <div className="mt-4">
      {/* Kontrol mikrofon untuk memulai dan menghentikan pengenalan suara id-ID. */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={isListening ? stopRecording : startRecording}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white transition ${
            isListening
              ? "bg-red-600 hover:bg-red-700"
              : "bg-[#0C3846] hover:bg-[#2A7387]"
          }`}
          aria-pressed={isListening}
        >
          <i
            className={`bi ${
              isListening ? "bi-stop-circle-fill" : "bi-mic-fill"
            }`}
            aria-hidden="true"
          />

          {isListening ? "Hentikan rekaman" : "Mulai berbicara"}
        </button>

        <span className="text-xs text-[#65828B]">
          Bahasa pengenalan: Indonesia
        </span>
      </div>

      {/* Menampilkan transkripsi sementara selama siswa berbicara. */}
      {interimTranscript && (
        <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#65828B]">
          <strong>Transkripsi sementara:</strong> {interimTranscript}
        </p>
      )}

      {/* Pesan status dan kesalahan untuk siswa. */}
      {statusMessage && (
        <p
          className="mt-3 text-xs leading-5 text-[#65828B]"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-6 text-red-700"
        >
          {errorMessage}
        </p>
      )}

      {/* Hasil transkripsi tetap dapat diedit secara manual. */}
      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className="mt-4 w-full resize-y rounded-2xl border border-[#DCEBF0] bg-white p-4 text-sm leading-7 text-[#173B46] outline-none transition placeholder:text-[#9AB0B7] focus:border-[#2A7387] focus:ring-2 focus:ring-[#E4F4F8]"
      />

      <div className="mt-2 text-right text-xs text-[#65828B]">
        {value.length}/{maxLength} karakter
      </div>

      <p className="mt-3 text-xs leading-5 text-[#9AB0B7]">
        Kamu tetap dapat mengetik atau mengedit jawaban setelah
        menggunakan fitur suara.
      </p>
    </div>
  );
}
