import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GamePlayer from "@/components/GamePlayer";

const validGames = [
  "knowledge",
  "creativity",
  "self-expression",
];

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
    return { title: "Game tidak ditemukan" };
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

  return <GamePlayer game={game} />;
}