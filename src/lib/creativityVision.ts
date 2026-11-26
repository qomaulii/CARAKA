import type {
  CreativityObjectDetectionStatus,
  CreativityScene,
  CreativityStimulusObject,
  DetectedVisionObject,
} from "@/lib/creativityTypes";

interface CocoDictionaryEntry {
  name: string;
  keywords: string[];
}

// Pemetaan kelas COCO (bahasa Inggris) ke nama objek dan sinonim langsung bahasa Indonesia.
// Daftar ini sengaja hanya mencakup penyebutan langsung objek (bukan kata terkait tidak langsung).
const COCO_TO_INDONESIAN: Record<string, CocoDictionaryEntry> = {
  person: {
    name: "orang",
    keywords: ["orang", "anak", "manusia", "tokoh", "sosok"],
  },
  bicycle: {
    name: "sepeda",
    keywords: ["sepeda", "ontel", "goes"],
  },
  car: {
    name: "mobil",
    keywords: ["mobil", "kendaraan"],
  },
  motorcycle: {
    name: "sepeda motor",
    keywords: ["motor", "sepeda motor"],
  },
  bus: {
    name: "bus",
    keywords: ["bus", "bis"],
  },
  truck: {
    name: "truk",
    keywords: ["truk"],
  },
  boat: {
    name: "perahu",
    keywords: ["perahu", "kapal", "sampan"],
  },
  bird: {
    name: "burung",
    keywords: ["burung", "unggas"],
  },
  cat: {
    name: "kucing",
    keywords: ["kucing"],
  },
  dog: {
    name: "anjing",
    keywords: ["anjing"],
  },
  horse: {
    name: "kuda",
    keywords: ["kuda"],
  },
  sheep: {
    name: "domba",
    keywords: ["domba", "kambing"],
  },
  cow: {
    name: "sapi",
    keywords: ["sapi", "lembu"],
  },
  backpack: {
    name: "tas",
    keywords: ["tas", "ransel"],
  },
  umbrella: {
    name: "payung",
    keywords: ["payung", "tenda"],
  },
  kite: {
    name: "layang-layang",
    keywords: ["layang-layang", "layangan"],
  },
  "sports ball": {
    name: "bola",
    keywords: ["bola"],
  },
  bottle: {
    name: "botol",
    keywords: ["botol"],
  },
  cup: {
    name: "gelas",
    keywords: ["gelas", "cangkir"],
  },
  bowl: {
    name: "mangkuk",
    keywords: ["mangkuk", "wadah", "ember", "keranjang"],
  },
  banana: {
    name: "pisang",
    keywords: ["pisang"],
  },
  apple: {
    name: "apel",
    keywords: ["apel", "buah"],
  },
  orange: {
    name: "jeruk",
    keywords: ["jeruk", "buah"],
  },
  chair: {
    name: "kursi",
    keywords: ["kursi", "bangku"],
  },
  bench: {
    name: "bangku",
    keywords: ["bangku", "kursi taman"],
  },
  "potted plant": {
    name: "tanaman",
    keywords: ["tanaman", "pot", "tumbuhan", "bunga"],
  },
  "dining table": {
    name: "meja",
    keywords: ["meja"],
  },
  book: {
    name: "buku",
    keywords: ["buku"],
  },
  clock: {
    name: "jam",
    keywords: ["jam"],
  },
  vase: {
    name: "vas",
    keywords: ["vas", "pot"],
  },
};

export interface SceneVisionResult {
  detectedObjects: DetectedVisionObject[];
  mergedObjects: CreativityStimulusObject[];
  status: CreativityObjectDetectionStatus;
  usedFallback: boolean;
  errorMessage?: string;
}

type CocoSsdModel = {
  detect: (
    img: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    maxNumBoxes?: number,
    minScore?: number,
  ) => Promise<
    Array<{
      class: string;
      score: number;
      bbox: [number, number, number, number];
    }>
  >;
};

let modelPromise: Promise<CocoSsdModel> | null = null;

/** Memuat model COCO-SSD secara lazy di browser (singleton per sesi halaman). */
async function loadCocoSsdModel(): Promise<CocoSsdModel> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      return cocoSsd.load({ base: "lite_mobilenet_v2" });
    })().catch((error) => {
      // Reset promise agar pemanggilan berikutnya bisa mencoba ulang.
      modelPromise = null;
      throw error;
    });
  }

  return modelPromise;
}

/** Merasterisasi gambar (termasuk SVG) ke offscreen canvas agar dapat dibaca model CV. */
function renderImageToCanvas(imageSrc: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const width = img.naturalWidth || 1200;
        const height = img.naturalHeight || 680;
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas 2D context tidak tersedia."));
          return;
        }

        // Isi latar putih sebelum menggambar ilustrasi SVG agar kontras terjaga.
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);
        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error(`Gagal memuat gambar ilustrasi: ${imageSrc}`));
    };

    img.src = imageSrc;
  });
}

function normalizeToken(value: string): string {
  return value.toLocaleLowerCase("id-ID").trim();
}

/** Menggabungkan objek hasil deteksi CV dengan metadata manual sebagai fallback. */
export function mergeVisionAndManualObjects(
  detectedObjects: DetectedVisionObject[],
  manualObjects: CreativityStimulusObject[],
): {
  mergedObjects: CreativityStimulusObject[];
  status: CreativityObjectDetectionStatus;
  usedFallback: boolean;
} {
  const manualCopies: CreativityStimulusObject[] = manualObjects.map((obj) => ({
    ...obj,
    keywords: [...obj.keywords],
    relatedTerms: [...obj.relatedTerms],
    source: "manual",
  }));

  if (detectedObjects.length === 0) {
    return {
      mergedObjects: manualCopies,
      status: "cv-fallback-manual",
      usedFallback: true,
    };
  }

  const matchedManualIndices = new Set<number>();
  const extraCvObjects: CreativityStimulusObject[] = [];
  const addedExtraNames = new Set<string>();

  for (const detected of detectedObjects) {
    const mapped = COCO_TO_INDONESIAN[detected.rawClass];
    const candidateKeywords = mapped
      ? mapped.keywords
      : [normalizeToken(detected.rawClass)];
    const labelId = mapped ? mapped.name : normalizeToken(detected.rawClass);

    let matchedExisting = false;

    manualCopies.forEach((manualObj, index) => {
      const manualWords = [
        normalizeToken(manualObj.name),
        ...manualObj.keywords.map(normalizeToken),
      ];

      const overlaps = candidateKeywords.some((kw) =>
        manualWords.includes(normalizeToken(kw)),
      );

      if (overlaps) {
        matchedExisting = true;
        matchedManualIndices.add(index);
        manualObj.source = "cv+manual";

        // Tambahkan sinonim langsung dari CV bila belum ada di metadata manual.
        for (const kw of candidateKeywords) {
          if (!manualObj.keywords.some((existing) => normalizeToken(existing) === normalizeToken(kw))) {
            manualObj.keywords.push(kw);
          }
        }
      }
    });

    if (!matchedExisting && !addedExtraNames.has(labelId)) {
      addedExtraNames.add(labelId);
      extraCvObjects.push({
        name: labelId,
        keywords: [...candidateKeywords],
        relatedTerms: [],
        source: "cv",
      });
    }
  }

  const mergedObjects = [...manualCopies, ...extraCvObjects];
  const hasUncoveredManual = manualCopies.some(
    (_, index) => !matchedManualIndices.has(index),
  );

  const status: CreativityObjectDetectionStatus = hasUncoveredManual
    ? "cv-partial-with-fallback"
    : "cv-detected";

  return {
    mergedObjects,
    status,
    usedFallback: hasUncoveredManual,
  };
}

/**
 * Menjalankan deteksi objek Computer Vision pada ilustrasi Creativity.
 * Selalu mengembalikan fallback metadata manual jika model gagal dimuat atau tidak mendeteksi objek.
 */
export async function detectSceneObjects(
  scene: CreativityScene,
): Promise<SceneVisionResult> {
  if (typeof window === "undefined") {
    return {
      detectedObjects: [],
      mergedObjects: scene.objects,
      status: "cv-fallback-manual",
      usedFallback: true,
    };
  }

  try {
    const [model, canvas] = await Promise.all([
      loadCocoSsdModel(),
      renderImageToCanvas(scene.imageSrc),
    ]);

    const predictions = await model.detect(canvas, 20, 0.35);

    const detectedObjects: DetectedVisionObject[] = predictions.map((item) => {
      const mapped = COCO_TO_INDONESIAN[item.class];
      return {
        rawClass: item.class,
        labelId: mapped ? mapped.name : item.class,
        score: Number(item.score.toFixed(3)),
        bbox: [
          Math.round(item.bbox[0]),
          Math.round(item.bbox[1]),
          Math.round(item.bbox[2]),
          Math.round(item.bbox[3]),
        ],
      };
    });

    const { mergedObjects, status, usedFallback } = mergeVisionAndManualObjects(
      detectedObjects,
      scene.objects,
    );

    return {
      detectedObjects,
      mergedObjects,
      status,
      usedFallback,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Deteksi gambar belum tersedia.";
    console.warn("CV fallback ke metadata manual:", message);

    return {
      detectedObjects: [],
      mergedObjects: scene.objects.map((obj) => ({ ...obj, source: "manual" })),
      status: "cv-fallback-manual",
      usedFallback: true,
      errorMessage: message,
    };
  }
}
