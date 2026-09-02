"use client";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-8 py-10 shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
        <h1 className="text-2xl font-semibold tracking-tight text-white">
          Unable to load FPL data.
        </h1>
        <p className="mt-2 text-white/60">Please try again.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
