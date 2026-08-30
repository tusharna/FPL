"use client";

type ErrorPageProps = {
  reset: () => void;
};

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-white">Unable to load FPL data.</h1>
      <p className="text-white/60">Please try again.</p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950"
      >
        Try again
      </button>
    </div>
  );
}
