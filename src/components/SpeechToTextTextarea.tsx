
"use client";

import { useEffect, useRef, useState } from "react";

// PERBAIKAN: Tipe lokal untuk Web Speech API agar kompatibel dengan TypeScript.
interface SpeechAlternativeLike {
  readonly transcript: string;
}

interface SpeechResultLike {
  readonly 0: SpeechAlternativeLike;
  readonly isFinal: boolean;
}

interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}

interface SpeechErrorLike {
  error: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechEventLike) => void) | null;
  onerror: ((event: SpeechErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

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
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // PERBAIKAN: Referensi ini menjaga teks terbaru saat hasil suara masuk.
  const latestValueRef = useRef(value);

  function handleTextChange(newValue: string) {
    latestValueRef.current = newValue;
    onChange(newValue);
  }

  // PERBAIKAN: Membersihkan proses pengenalan suara saat komponen dilepas.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function startRecording() {
    setErrorMessage("");
    setStatusMessage("");

    // PERBAIKAN: Mendukung API standar dan prefiks WebKit.
    const browserWindow = window as SpeechWindow;

    const SpeechRecognition =
      browserWindow.SpeechRecognition ??
      browserWindow.webkitSpeechRecognition;

    // PERBAIKAN: Berikan informasi jika browser tidak mendukung STT.
    if (!SpeechRecognition) {
      setErrorMessage(
        "Browser ini belum mendukung pengenalan suara. Gunakan browser yang mendukung Speech Recognition.",
      );
      return;
    }

    const recognition = new SpeechRecognition();

    let hasRecognitionError = false;

    // PERBAIKAN: Mengatur pengenalan suara dalam Bahasa Indonesia.
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // PERBAIKAN: Mengolah hasil suara menjadi teks.
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index++
      ) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      // Tampilkan teks sementara sebelum hasil dikonfirmasi.
      setInterimTranscript(interimText);

      // Masukkan hanya hasil final ke kolom jawaban.
      if (finalText.trim()) {
        const currentText = latestValueRef.current;
        const separator =
          currentText.length > 0 && !/\s$/.test(currentText)
            ? " "
            : "";

        const availableCharacters = Math.max(
          0,
          maxLength - currentText.length,
        );

        const acceptedText = finalText
          .trim()
          .slice(0, availableCharacters);

        if (!acceptedText) {
          setStatusMessage(
            `Batas ${maxLength} karakter sudah tercapai.`,
          );
          return;
        }

        const updatedText =
          currentText + separator + acceptedText;

        latestValueRef.current = updatedText;
        onChange(updatedText);

        if (acceptedText.length < finalText.trim().length) {
          setStatusMessage(
            `Teks dipotong karena batas maksimal ${maxLength} karakter.`,
          );
        }
      }
    };

    // PERBAIKAN: Menangani kegagalan pengenalan suara.
    recognition.onerror = (event) => {
      hasRecognitionError = true;
      setIsListening(false);
      setInterimTranscript("");

      const errorMessages: Record<string, string> = {
        "not-allowed":
          "Izin mikrofon ditolak. Aktifkan izin mikrofon melalui pengaturan browser.",
        "service-not-allowed":
          "Layanan pengenalan suara tidak diizinkan oleh browser.",
        "no-speech":
          "Suara belum terdeteksi. Coba berbicara kembali.",
        "audio-capture":
          "Mikrofon tidak ditemukan atau tidak dapat digunakan.",
        network:
          "Koneksi ke layanan pengenalan suara bermasalah.",
        "language-not-supported":
          "Pengenalan Bahasa Indonesia belum didukung oleh layanan ini.",
        "language-unavailable":
          "Layanan pengenalan Bahasa Indonesia sedang tidak tersedia.",
      };

      setErrorMessage(
        errorMessages[event.error] ??
          "Terjadi kesalahan saat mengenali suara. Silakan coba kembali.",
      );
    };

    // PERBAIKAN: Mengatur status setelah perekaman dihentikan.
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      if (!hasRecognitionError) {
        setStatusMessage(
          "Perekaman selesai. Periksa kembali teks hasil transkripsi.",
        );
      }

      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;

    try {
      // Browser akan meminta izin mikrofon saat proses dimulai.
      recognition.start();

      setIsListening(true);
      setStatusMessage(
        "Mendengarkan... Silakan berbicara dalam Bahasa Indonesia.",
      );
    } catch {
      recognitionRef.current = null;
      setIsListening(false);

      setErrorMessage(
        "Mikrofon belum dapat dimulai. Periksa izin mikrofon dan coba kembali.",
      );
    }
  }

  function stopRecording() {
    const recognition = recognitionRef.current;

    if (!recognition) return;

    setStatusMessage("Menghentikan perekaman...");
    recognition.stop();
  }

  return (
    <div className="mt-4">

      {/* PERBAIKAN: Kontrol mikrofon untuk memulai dan menghentikan STT. */}
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

      {/* PERBAIKAN: Menampilkan teks sementara selama siswa berbicara. */}
      {interimTranscript && (
        <p className="mt-3 rounded-xl bg-[#F1F7F9] p-3 text-sm leading-6 text-[#65828B]">
          <strong>Transkripsi sementara:</strong> {interimTranscript}
        </p>
      )}

      {/* PERBAIKAN: Pesan status dan kesalahan untuk siswa. */}
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

      {/* PERBAIKAN: Hasil transkripsi tetap dapat diedit secara manual. */}
      <textarea
        id={id}
        value={value}
        onChange={(event) => handleTextChange(event.target.value)}
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
