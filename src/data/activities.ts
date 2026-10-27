export type Activity = {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  color: string;
  iconColor: string;
};

export const activities: Activity[] = [
  {
    id: "knowledge",
    number: "01",
    title: "Knowledge",
    subtitle: "Ayo, berpikir!",
    description:
      "Jawab pertanyaan dan temukan pengetahuan baru melalui kuis interaktif.",
    icon: "bi-lightbulb",
    color: "bg-[#E4F4F8]",
    iconColor: "text-[#2A7387]",
  },
  {
    id: "creativity",
    number: "02",
    title: "Creativity",
    subtitle: "Ayo, berkreasi!",
    description:
      "Amati gambar, kembangkan ide, dan buat sesuatu dari imajinasimu.",
    icon: "bi-palette",
    color: "bg-[#FFF3D9]",
    iconColor: "text-[#94651B]",
  },
  {
    id: "self-expression",
    number: "03",
    title: "Self-Expression",
    subtitle: "Ayo, bercerita!",
    description:
      "Sampaikan pendapat, ceritakan gagasan, dan latih keberanian berbicara.",
    icon: "bi-chat-square-text",
    color: "bg-[#E4F4F8]",
    iconColor: "text-[#2A7387]",
  },
];