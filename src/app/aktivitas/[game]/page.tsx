
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import KnowledgePlayer from "@/components/KnowledgePlayer";
import CreativityPlayer from "@/components/CreativityPlayer";
import SelfExpressionPlayer from "@/components/SelfExpressionPlayer";

const validGames = [
  "knowledge",
  "creativity",
  "self-expression",
];

export function generateStaticParams() {
  return validGames.map((game) => ({
    game,
  }));
}

type Props = {
  params: Promise<{
    game: string;
  }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { game } = await params;

  const titles: Record<string, string> = {
    knowledge: "Knowledge",
    creativity: "Creativity",
    "self-expression": "Self-Expression",
  };

  if (!titles[game]) {
    return { title: "Aktivitas tidak ditemukan" };
  }

  return {
    title: titles[game],
    description: `Aktivitas ${titles[game]} di CARAKA.`,
  };
}


export default async function GamePage({ params }: Props) {
  const { game } = await params;

  if (!validGames.includes(game)) {
    notFound();
  }

  // PERBAIKAN: Knowledge tetap menggunakan KnowledgePlayer.
  if (game === "knowledge") {
    return <KnowledgePlayer />;
  }

  // PERBAIKAN: Creativity menggunakan komponen khusus yang baru.
  if (game === "creativity") {
    return <CreativityPlayer />;
  }

  // Self-Expression menggunakan komponen khusus dengan Adaptive Engine tersendiri.
  if (game === "self-expression") {
    return <SelfExpressionPlayer />;
  }

  notFound();
}

