
import { Suspense } from "react";
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

type Props = {
  params: Promise<{
    game: string;
  }>;
};

export function generateStaticParams() {
  return validGames.map((game) => ({
    game,
  }));
}

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

// PERUBAHAN: akses params dipindahkan ke komponen asinkron.
async function GameContent({ params }: Props) {
  const { game } = await params;

  if (!validGames.includes(game)) {
    notFound();
  }

  if (game === "knowledge") {
    return <KnowledgePlayer />;
  }

  if (game === "creativity") {
    return <CreativityPlayer />;
  }

  if (game === "self-expression") {
    return <SelfExpressionPlayer />;
  }

  notFound();
}

// PERUBAHAN: Suspense membungkus komponen yang membaca URL params.
export default function GamePage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          role="status"
          aria-live="polite"
        >
          Menyiapkan aktivitas...
        </div>
      }
    >
      <GameContent params={params} />
    </Suspense>
  );
}
