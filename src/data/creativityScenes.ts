
import type {
  CreativityAgeBand,
  CreativityComplexity,
  CreativityScene,
  CreativityStimulusObject,
} from "@/lib/creativityTypes";

// PERBAIKAN: Memisahkan alias objek dan istilah terkait.
// keywords hanya digunakan untuk mengenali objek yang disebut siswa.
function createObject(
  name: string,
  keywords: string[],
  relatedTerms: string[],
): CreativityStimulusObject {
  return {
    name,
    keywords,
    relatedTerms,
  };
}

// PERBAIKAN: Metadata diselaraskan dengan enam ilustrasi SVG.
// Daftar ini merupakan anotasi manual, bukan hasil Computer Vision.
export const CREATIVITY_SCENES: CreativityScene[] = [
  // ==========================================================
  // 1. PANTAI CERIA | KELAS 3-4
  // ==========================================================
  {
    id: "pantai-ceria-34",
    title: "Suasana pantai dan perahu",
    imageSrc: "/creativity-scenes/pantai-ceria.svg",
    ageBand: "kelas-3-4",
    complexity: "simple",
    setting: "pantai pesisir",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "perahu",
        ["perahu", "perahu layar", "sampan", "jukung"],
        ["layar", "mendayung", "berlayar", "nelayan", "melaut"],
      ),
      createObject(
        "pohon kelapa",
        ["pohon kelapa", "nyiur", "pohon nyiur"],
        ["daun kelapa", "pelepah", "buah kelapa", "batang pohon", "teduh"],
      ),
      createObject(
        "anak",
        ["anak", "anak-anak", "bocah", "seorang anak"],
        ["bermain", "berlari", "berjalan", "teman", "berlibur"],
      ),
      createObject(
        "kepiting",
        ["kepiting", "ketam"],
        ["capit", "cangkang", "hewan pantai", "pasir"],
      ),
      createObject(
        "burung",
        ["burung", "burung laut"],
        ["sayap", "paruh", "terbang", "berkicau", "sarang"],
      ),
      createObject(
        "kerang",
        ["kerang", "cangkang kerang", "kulit kerang"],
        ["pasir", "pantai", "hewan laut", "mutiara"],
      ),
      createObject(
        "matahari",
        ["matahari", "surya", "sang surya"],
        ["sinar matahari", "cahaya", "panas", "siang"],
      ),
      createObject(
        "awan",
        ["awan", "mega", "awan putih"],
        ["langit", "mendung", "cuaca", "langit cerah"],
      ),
      createObject(
        "laut",
        ["laut", "lautan", "air laut"],
        ["ombak", "gelombang", "air asin", "pasang", "surut", "buih"],
      ),
      createObject(
        "pasir pantai",
        ["pasir", "pasir pantai"],
        ["garis pantai", "jejak kaki", "bermain pasir", "tepi laut"],
      ),
    ],
  },

  // ==========================================================
  // 2. PASAR TRADISIONAL | KELAS 3-4
  // ==========================================================
  {
    id: "pasar-warna-34",
    title: "Suasana pasar tradisional",
    imageSrc: "/creativity-scenes/pasar-warna.svg",
    ageBand: "kelas-3-4",
    complexity: "medium",
    setting: "pasar tradisional",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "lapak pasar",
        ["lapak", "kios", "los pasar", "tempat berjualan"],
        ["atap kios", "kanopi", "meja dagangan", "dagangan"],
      ),
      createObject(
        "orang",
        ["orang", "seseorang", "pengunjung", "warga", "pedagang", "pembeli", "penjual"],
        ["berjalan", "berbicara", "bertemu", "berbelanja", "ramai"],
      ),
      createObject(
        "buah dagangan",
        ["buah", "buah-buahan", "buah dagangan"],
        ["kulit buah", "biji", "matang", "segar", "manis"],
      ),
      createObject(
        "sayuran dagangan",
        ["sayur", "sayuran", "sayur-mayur"],
        ["daun", "batang", "bahan makanan", "segar", "ditimbang"],
      ),
      createObject(
        "meja dagangan",
        ["meja dagangan", "meja jualan", "meja kios"],
        ["tempat menaruh barang", "dagangan", "lapak"],
      ),
      createObject(
        "atap kios",
        ["atap kios", "kanopi kios", "tenda kios", "atap lapak"],
        ["berteduh", "panas", "hujan", "melindungi barang"],
      ),
    ],
  },

  // ==========================================================
  // 3. KEBUN SEKOLAH | KELAS 3-4
  // ==========================================================
  {
    id: "kebun-sekolah-34",
    title: "Kebun sekolah yang ramai",
    imageSrc: "/creativity-scenes/kebun-sekolah.svg",
    ageBand: "kelas-3-4",
    complexity: "complex",
    setting: "halaman sekolah dan kebun",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "gedung sekolah",
        ["gedung sekolah", "bangunan sekolah", "gedung"],
        ["ruang kelas", "pintu", "jendela", "atap", "halaman sekolah"],
      ),
      createObject(
        "siswa",
        ["siswa", "murid", "pelajar", "anak sekolah"],
        ["belajar", "bermain", "teman", "guru", "merawat tanaman"],
      ),
      createObject(
        "pohon",
        ["pohon", "pepohonan"],
        ["batang", "akar", "daun", "ranting", "cabang", "teduh"],
      ),
      createObject(
        "tanaman dan bunga",
        ["tanaman", "tumbuhan", "bunga", "kembang", "tanaman hias"],
        ["kelopak", "tangkai", "daun", "akar", "menyiram", "mekar"],
      ),
      createObject(
        "petak kebun",
        ["petak kebun", "kebun kecil", "bedeng tanaman", "area kebun"],
        ["menanam", "tanah", "pupuk", "menyiram", "merawat tanaman"],
      ),
      createObject(
        "bendera",
        ["bendera", "umbul-umbul"],
        ["tiang bendera", "berkibar", "angin", "warna"],
      ),
      createObject(
        "burung",
        ["burung", "burung kecil"],
        ["sayap", "paruh", "terbang", "berkicau", "sarang"],
      ),
      createObject(
        "matahari",
        ["matahari", "surya", "sang surya"],
        ["sinar matahari", "cahaya", "panas", "langit"],
      ),
    ],
  },

  // ==========================================================
  // 4. HALAMAN SEKOLAH | KELAS 5-6
  // ==========================================================
  {
    id: "halaman-sekolah-56",
    title: "Aktivitas di halaman sekolah",
    imageSrc: "/creativity-scenes/halaman-sekolah.svg",
    ageBand: "kelas-5-6",
    complexity: "simple",
    setting: "halaman sekolah",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "gedung sekolah",
        ["gedung sekolah", "bangunan sekolah", "gedung"],
        ["ruang kelas", "pintu", "jendela", "atap", "halaman"],
      ),
      createObject(
        "siswa",
        ["siswa", "murid", "pelajar", "peserta didik"],
        ["belajar", "bermain", "berjalan", "berteman", "kegiatan sekolah"],
      ),
      createObject(
        "pohon",
        ["pohon", "pepohonan"],
        ["batang", "akar", "daun", "ranting", "teduh"],
      ),
      createObject(
        "bangku",
        ["bangku", "kursi panjang", "tempat duduk"],
        ["duduk", "papan dudukan", "beristirahat"],
      ),
      createObject(
        "pot tanaman",
        ["pot tanaman", "pot bunga", "pot"],
        ["tanah", "tanaman hias", "daun", "akar", "menyiram"],
      ),
      createObject(
        "benda bulat",
        ["benda bulat", "bola"],
        ["menggelinding", "permainan", "bentuk lingkaran"],
      ),
      createObject(
        "matahari",
        ["matahari", "surya", "sang surya"],
        ["sinar matahari", "cahaya", "panas", "langit cerah"],
      ),
      createObject(
        "jalan setapak",
        ["jalan setapak", "jalan kecil", "jalur"],
        ["berjalan", "halaman", "menuju kelas"],
      ),
    ],
  },

  // ==========================================================
  // 5. PASAR PAGI | KELAS 5-6
  // ==========================================================
  {
    id: "pasar-pagi-56",
    title: "Kegiatan pasar pagi",
    imageSrc: "/creativity-scenes/pasar-pagi.svg",
    ageBand: "kelas-5-6",
    complexity: "medium",
    setting: "pasar pagi",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "lapak pasar",
        ["lapak", "kios", "los pasar", "tempat berjualan"],
        ["atap kios", "meja dagangan", "dagangan", "pasar"],
      ),
      createObject(
        "orang",
        ["orang", "seseorang", "pengunjung", "warga", "pedagang", "pembeli", "penjual"],
        ["berjalan", "berbicara", "bertemu", "berbelanja", "ramai"],
      ),
      createObject(
        "sepeda",
        ["sepeda", "sepeda kayuh", "kendaraan roda dua"],
        ["roda", "pedal", "setang", "rantai", "rem", "parkir"],
      ),
      createObject(
        "buah dagangan",
        ["buah", "buah-buahan", "buah segar"],
        ["kulit buah", "biji", "matang", "segar", "manis"],
      ),
      createObject(
        "sayuran dagangan",
        ["sayur", "sayuran", "sayur-mayur"],
        ["daun", "batang", "bahan makanan", "ditimbang", "dimasak"],
      ),
      createObject(
        "atap kios",
        ["atap kios", "kanopi", "tenda kios", "atap lapak"],
        ["berteduh", "melindungi dari panas", "melindungi dari hujan"],
      ),
      createObject(
        "matahari",
        ["matahari", "surya", "sang surya"],
        ["sinar matahari", "cahaya", "panas", "pagi hari"],
      ),
    ],
  },

  // ==========================================================
  // 6. KAWASAN PESISIR | KELAS 5-6
  // ==========================================================
  {
    id: "pesisir-bersama-56",
    title: "Kegiatan di kawasan pesisir",
    imageSrc: "/creativity-scenes/pesisir-bersama.svg",
    ageBand: "kelas-5-6",
    complexity: "complex",
    setting: "kawasan pesisir",
    objectDetectionStatus: "manual-metadata-placeholder",
    objects: [
      createObject(
        "orang",
        ["orang", "seseorang", "warga", "masyarakat", "pengunjung", "relawan"],
        ["berjalan", "bekerja sama", "berkegiatan", "beraktivitas bersama"],
      ),
      createObject(
        "perahu",
        ["perahu", "perahu layar", "sampan", "kapal layar", "jukung"],
        ["layar", "tiang layar", "berlayar", "nelayan", "melaut"],
      ),
      createObject(
        "tempat sampah",
        ["tempat sampah", "tong sampah", "bak sampah"],
        ["membuang sampah", "memilah sampah", "kebersihan", "daur ulang"],
      ),
      createObject(
        "ember",
        ["ember", "wadah ember"],
        ["wadah", "air", "mengisi", "membawa", "mengumpulkan"],
      ),
      createObject(
        "pohon",
        ["pohon", "pepohonan"],
        ["batang", "akar", "daun", "ranting", "teduh"],
      ),
      createObject(
        "kepiting",
        ["kepiting", "ketam"],
        ["capit", "cangkang", "hewan pantai", "pasir"],
      ),
      createObject(
        "burung",
        ["burung", "burung laut"],
        ["sayap", "paruh", "terbang", "sarang", "berkicau"],
      ),
      createObject(
        "laut",
        ["laut", "air laut", "lautan", "perairan"],
        ["ombak", "gelombang", "air asin", "pasang", "surut", "pesisir"],
      ),
      createObject(
        "pantai dan pasir",
        ["pantai", "pasir pantai", "tepi laut", "pesisir"],
        ["garis pantai", "ombak", "jejak kaki", "bermain pasir", "kebersihan pantai"],
      ),
      createObject(
        "matahari",
        ["matahari", "surya", "sang surya"],
        ["sinar matahari", "cahaya", "panas", "langit cerah"],
      ),
    ],
  },
];

// Fungsi kelompok usia tetap dipertahankan.
export function getAgeBand(grade: 3 | 4 | 5 | 6): CreativityAgeBand {
  return grade <= 4 ? "kelas-3-4" : "kelas-5-6";
}

// Fungsi label kompleksitas tetap dipertahankan.
export function getComplexityLabel(
  complexity: CreativityComplexity,
): string {
  const labels: Record<CreativityComplexity, string> = {
    simple: "Sederhana",
    medium: "Menengah",
    complex: "Lebih kompleks",
  };

  return labels[complexity];
}
