"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  error?: string;
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

const SPEECH_ERROR_MESSAGES: Record<string, string> = {
  "not-allowed":
    "Izin mikrofon ditolak. Kamu tetap bisa menjawab dengan mengetik, atau aktifkan izin mikrofon melalui pengaturan browser.",
  "service-not-allowed":
    "Layanan pengenalan suara tidak diizinkan oleh browser. Kamu tetap bisa menjawab dengan mengetik.",
  "no-speech":
    "Suara belum terdeteksi. Coba berbicara kembali atau ketik jawabanmu.",
  "audio-capture":
    "Mikrofon tidak ditemukan atau tidak dapat digunakan. Kamu tetap bisa menulis jawaban.",
  network:
    "Koneksi ke layanan pengenalan suara bermasalah. Kamu tetap bisa menulis jawaban.",
  "language-not-supported":
    "Pengenalan Bahasa Indonesia (id-ID) belum didukung oleh layanan ini. Silakan jawab melalui teks.",
  "language-unavailable":
    "Layanan pengenalan Bahasa Indonesia sedang tidak tersedia. Silakan jawab melalui teks.",
};

export interface UseSpeechToTextOptions {
  value: string;
  onChange: (value: string) => void;
  maxLength: number;
  onFinalTranscript?: () => void;
  onFallbackToText?: () => void;
}

/**
 * Hook bersama untuk pengenalan suara Bahasa Indonesia (id-ID) via Web Speech API.
 * Selalu menyediakan fallback aman ke input teks jika browser tidak mendukung atau izin ditolak.
 */
export function useSpeechToText({
  value,
  onChange,
  maxLength,
  onFinalTranscript,
  onFallbackToText,
}: UseSpeechToTextOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const latestValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  const onFallbackToTextRef = useRef(onFallbackToText);

  useEffect(() => {
    latestValueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onFinalTranscriptRef.current = onFinalTranscript;
  }, [onFinalTranscript]);

  useEffect(() => {
    onFallbackToTextRef.current = onFallbackToText;
  }, [onFallbackToText]);

  // Bersihkan sesi SpeechRecognition saat komponen dilepas dari DOM.
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Abaikan jika browser sudah menghentikan pengenalan suara.
      }
      recognitionRef.current = null;
    };
  }, []);

  const stopRecording = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setIsListening(false);
      return;
    }

    setStatusMessage("Menghentikan perekaman...");
    try {
      recognition.stop();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, []);

  const resetMessages = useCallback(() => {
    setInterimTranscript("");
    setStatusMessage("");
    setErrorMessage("");
  }, []);

  const startRecording = useCallback((): boolean => {
    setErrorMessage("");
    setStatusMessage("");

    const browserWindow = window as SpeechWindow;
    const SpeechRecognition =
      browserWindow.SpeechRecognition ??
      browserWindow.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage(
        "Browser ini belum mendukung pengenalan suara. Kamu tetap bisa menjawab dengan mengetik.",
      );
      onFallbackToTextRef.current?.();
      return false;
    }

    try {
      recognitionRef.current?.abort();
    } catch {
      // Abaikan error saat menghentikan sesi sebelumnya.
    }

    const recognition = new SpeechRecognition();
    let hasRecognitionError = false;

    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result?.[0]?.transcript ?? "";

        if (result?.isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }

      setInterimTranscript(interimText);

      if (finalText.trim()) {
        const currentText = latestValueRef.current;
        const separator =
          currentText.length > 0 && !/\s$/.test(currentText) ? " " : "";
        const availableCharacters = Math.max(
          0,
          maxLength - currentText.length - separator.length,
        );
        const acceptedText = finalText.trim().slice(0, availableCharacters);

        if (!acceptedText) {
          setStatusMessage(`Batas ${maxLength} karakter sudah tercapai.`);
          return;
        }

        const updatedText = currentText + separator + acceptedText;
        latestValueRef.current = updatedText;
        onChangeRef.current(updatedText);
        onFinalTranscriptRef.current?.();

        if (acceptedText.length < finalText.trim().length) {
          setStatusMessage(
            `Teks dipotong karena batas maksimal ${maxLength} karakter.`,
          );
        }
      }
    };

    recognition.onerror = (event) => {
      hasRecognitionError = true;
      setIsListening(false);
      setInterimTranscript("");
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }

      const code = event.error ?? "";
      setErrorMessage(
        SPEECH_ERROR_MESSAGES[code] ??
          "Terjadi kesalahan saat mengenali suara. Kamu tetap dapat menjawab melalui teks.",
      );
      onFallbackToTextRef.current?.();
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");

      if (!hasRecognitionError) {
        setStatusMessage(
          "Perekaman selesai. Periksa kembali teks hasil transkripsi.",
        );
      }

      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsListening(true);
      setStatusMessage(
        "Mendengarkan... Silakan berbicara dalam Bahasa Indonesia.",
      );
      return true;
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setErrorMessage(
        "Mikrofon belum dapat dimulai. Periksa izin mikrofon atau lanjutkan dengan mengetik.",
      );
      onFallbackToTextRef.current?.();
      return false;
    }
  }, [maxLength]);

  return {
    isListening,
    interimTranscript,
    statusMessage,
    errorMessage,
    startRecording,
    stopRecording,
    resetMessages,
  };
}
