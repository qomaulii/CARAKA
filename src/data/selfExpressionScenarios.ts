import type {
  SelfExpressionAgeBand,
  SelfExpressionGrade,
  SelfExpressionScenario,
} from "@/lib/selfExpressionTypes";

export function getSelfExpressionAgeBand(
  grade: SelfExpressionGrade,
): SelfExpressionAgeBand {
  return grade <= 4 ? "kelas-3-4" : "kelas-5-6";
}

export const SELF_EXPRESSION_SCENARIOS: SelfExpressionScenario[] = [
  {
    id: "se-teman-sendirian-34",
    title: "Teman yang duduk sendirian",
    ageBand: "kelas-3-4",
    complexity: "simple",
    situation:
      "Saat jam istirahat, seorang anak melihat temannya duduk sendirian di bangku kelas sementara teman-teman lainnya sedang bermain bersama di halaman.",
    questions: [
      "Menurutmu, bagaimana perasaan anak yang duduk sendirian itu?",
      "Apa yang akan kamu lakukan jika berada dalam situasi tersebut?",
      "Mengapa kamu memilih tindakan itu?",
    ],
    scenarioKeywords: [
      "teman",
      "sendirian",
      "istirahat",
      "duduk",
      "bermain",
      "mengajak",
      "halaman",
      "kelas",
    ],
    guidancePrompts: [
      "Bayangkan bagaimana rasanya jika kamu duduk sendiri saat teman lain bermain.",
      "Pikirkan satu hal sederhana yang bisa kamu katakan atau lakukan kepadanya.",
      "Tambahkan kata 'karena' atau 'supaya' untuk menjelaskan alasan pilihanmu.",
    ],
  },
  {
    id: "se-antre-kantin-34",
    title: "Antre di kantin sekolah",
    ageBand: "kelas-3-4",
    complexity: "simple",
    situation:
      "Saat jam istirahat, antrean di kantin cukup panjang. Tiba-tiba ada teman yang langsung berdiri di barisan paling depan tanpa mengantre.",
    questions: [
      "Menurutmu, bagaimana perasaan anak-anak yang sudah lama mengantre?",
      "Apa yang akan kamu lakukan saat melihat kejadian itu?",
      "Mengapa kamu memilih tindakan tersebut?",
    ],
    scenarioKeywords: [
      "antre",
      "kantin",
      "barisan",
      "depan",
      "menunggu",
      "giliran",
      "tertib",
      "teman",
    ],
    guidancePrompts: [
      "Ceritakan perasaan anak-anak yang sudah menunggu sesuai urutan.",
      "Jelaskan cara yang sopan untuk mengingatkan temanmu atau menjaga antrean.",
      "Jelaskan alasan mengapa pilihan tindakanmu baik dilakukan.",
    ],
  },
  {
    id: "se-sampah-halaman-34",
    title: "Sampah di halaman sekolah",
    ageBand: "kelas-3-4",
    complexity: "medium",
    situation:
      "Setelah jam istirahat, banyak bungkus makanan berserakan di halaman sekolah. Beberapa siswa hanya melewatinya tanpa memungut sampah tersebut.",
    questions: [
      "Bagaimana perasaanmu melihat halaman sekolah yang kotor oleh sampah?",
      "Apa yang akan kamu lakukan dalam situasi itu?",
      "Mengapa kamu memilih tindakan tersebut?",
    ],
    scenarioKeywords: [
      "sampah",
      "halaman",
      "sekolah",
      "bersih",
      "kotor",
      "bungkus",
      "membuang",
      "tempat sampah",
    ],
    guidancePrompts: [
      "Sampaikan perasaanmu saat melihat lingkungan sekolah menjadi kotor.",
      "Sebutkan tindakan nyata yang bisa kamu lakukan sendiri atau bersama teman.",
      "Jelaskan alasan mengapa halaman sekolah perlu dijaga kebersihannya.",
    ],
  },
  {
    id: "se-pinjam-penghapus-34",
    title: "Penghapus teman terjatuh dan hilang",
    ageBand: "kelas-3-4",
    complexity: "medium",
    situation:
      "Kamu meminjam penghapus milik teman sebangkumu. Saat mengembalikannya, penghapus itu tidak sengaja terjatuh dan tidak langsung ditemukan.",
    questions: [
      "Menurutmu, bagaimana perasaan temanmu jika penghapusnya hilang?",
      "Apa yang akan kamu lakukan untuk menghadapi situasi itu?",
      "Mengapa kamu memilih tindakan tersebut?",
    ],
    scenarioKeywords: [
      "penghapus",
      "pinjam",
      "teman",
      "hilang",
      "jatuh",
      "mencari",
      "maaf",
      "mengganti",
    ],
    guidancePrompts: [
      "Pikirkan bagaimana perasaan temanmu ketika barang miliknya hilang.",
      "Jelaskan langkah jujur yang akan kamu ambil kepada temanmu.",
      "Berikan alasan mengapa tindakan tersebut penting untuk pertemanan kalian.",
    ],
  },
  {
    id: "se-bawa-buku-34",
    title: "Teman kesulitan membawa tumpukan buku",
    ageBand: "kelas-3-4",
    complexity: "complex",
    situation:
      "Di lorong sekolah, kamu melihat seorang teman berjalan pelan sambil membawa tumpukan buku yang hampir jatuh, padahal kamu sedang terburu-buru menuju lapangan olahraga.",
    questions: [
      "Menurutmu, bagaimana perasaan teman yang membawa buku berat itu?",
      "Apa yang akan kamu lakukan saat berada di situasi tersebut?",
      "Mengapa kamu memilih tindakan itu meskipun sedang terburu-buru?",
    ],
    scenarioKeywords: [
      "buku",
      "membawa",
      "membantu",
      "jatuh",
      "teman",
      "lorong",
      "olahraga",
      "menolong",
    ],
    guidancePrompts: [
      "Ungkapkan perasaan temanmu yang kesulitan membawa buku sendirian.",
      "Jelaskan pilihanmu antara langsung pergi atau meluangkan waktu sebentar membantu.",
      "Tuliskan alasan yang mendasari keputusanmu.",
    ],
  },
  {
    id: "se-teman-baru-56",
    title: "Siswa baru yang tampak canggung",
    ageBand: "kelas-5-6",
    complexity: "simple",
    situation:
      "Ada siswa pindahan baru di kelasmu. Pada hari pertamanya, ia terlihat bingung saat mencari kelompok untuk kegiatan belajar berpasangan.",
    questions: [
      "Menurutmu, bagaimana perasaan siswa baru tersebut?",
      "Apa yang akan kamu lakukan jika berada di kelas itu?",
      "Mengapa kamu memilih tindakan tersebut?",
    ],
    scenarioKeywords: [
      "baru",
      "siswa",
      "kelompok",
      "bingung",
      "kelas",
      "mengajak",
      "berkenalan",
      "teman",
    ],
    guidancePrompts: [
      "Jelaskan kemungkinan perasaan siswa yang baru pindah ke sekolah baru.",
      "Tuliskan sikap atau tindakan yang bisa membuat ia merasa diterima.",
      "Sertakan alasan mengapa tindakanmu dapat membantu situasi tersebut.",
    ],
  },
  {
    id: "se-beda-pendapat-56",
    title: "Berbeda pendapat dalam kelompok",
    ageBand: "kelas-5-6",
    complexity: "medium",
    situation:
      "Kelompokmu sedang membuat poster tugas sekolah. Kamu punya ide berbeda dari sebagian besar anggota kelompok, dan mereka belum sempat mendengarkan usulanmu.",
    questions: [
      "Bagaimana perasaanmu ketika idemu belum didengarkan oleh kelompok?",
      "Apa yang akan kamu lakukan untuk menyampaikan pendapat dan menyelesaikan perbedaan itu?",
      "Mengapa cara tersebut menurutmu paling tepat?",
    ],
    scenarioKeywords: [
      "pendapat",
      "kelompok",
      "poster",
      "ide",
      "diskusi",
      "sepakat",
      "mendengarkan",
      "sopan",
    ],
    guidancePrompts: [
      "Ceritakan perasaanmu saat usulanmu belum mendapat perhatian.",
      "Jelaskan bagaimana cara menyampaikan ide secara sopan dan menghargai teman lain.",
      "Jelaskan alasan mengapa cara itu dapat membantu kelompok mencapai kesepakatan.",
    ],
  },
  {
    id: "se-sampah-halaman-56",
    title: "Kebiasaan membuang sampah sembarangan",
    ageBand: "kelas-5-6",
    complexity: "medium",
    situation:
      "Di halaman sekolah sering terlihat sampah plastik setelah jam istirahat. Beberapa teman menganggap hal itu biasa saja karena ada petugas kebersihan.",
    questions: [
      "Bagaimana perasaan atau pendapatmu terhadap anggapan tersebut?",
      "Apa yang akan kamu lakukan untuk mengajak teman-teman lebih peduli?",
      "Mengapa tindakan yang kamu pilih penting bagi warga sekolah?",
    ],
    scenarioKeywords: [
      "sampah",
      "sekolah",
      "kebersihan",
      "petugas",
      "peduli",
      "mengajak",
      "lingkungan",
      "tanggung jawab",
    ],
    guidancePrompts: [
      "Sampaikan pendapatmu tentang tanggung jawab menjaga kebersihan sekolah.",
      "Sebutkan tindakan atau ajakan yang bisa kamu lakukan bersama teman.",
      "Tambahkan alasan dampak baik dari tindakan yang kamu pilih.",
    ],
  },
  {
    id: "se-tugas-vs-main-56",
    title: "Ajakan bermain saat tugas belum selesai",
    ageBand: "kelas-5-6",
    complexity: "complex",
    situation:
      "Sepulang sekolah, teman dekatmu mengajak bermain gim bersama, padahal tugas kelompok yang menjadi bagianmu harus dikumpulkan besok pagi dan belum selesai.",
    questions: [
      "Bagaimana perasaanmu saat dihadapkan pada ajakan teman dan tanggung jawab tugas?",
      "Apa keputusan yang akan kamu ambil dan bagaimana kamu menyampaikannya kepada temanmu?",
      "Mengapa kamu memilih keputusan tersebut?",
    ],
    scenarioKeywords: [
      "tugas",
      "bermain",
      "teman",
      "tanggung jawab",
      "kelompok",
      "selesai",
      "menolak",
      "menjelaskan",
    ],
    guidancePrompts: [
      "Ceritakan perasaanmu ketika harus memilih antara bermain dan menyelesaikan tugas.",
      "Jelaskan pilihan tindakanmu serta cara berbicara yang baik kepada temanmu.",
      "Sertakan alasan yang mempertimbangkan dampak bagi dirimu dan kelompok.",
    ],
  },
];
