import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

type GameweekSummaryProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function GameweekSummary({
  title,
  description,
  children,
}: GameweekSummaryProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <Link
          href="/gameweeks"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to history
        </Link>
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-white">{title}</h1>
          <p className="mt-2 text-sm text-white/60">{description}</p>
        </div>
      </header>
      {children}
    </div>
  );
}
