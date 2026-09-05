import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: PanelProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/[0.09] bg-white/[0.03] shadow-[0_24px_64px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-white/20 before:to-transparent ${className}`}
    >
      {children}
    </section>
  );
}

