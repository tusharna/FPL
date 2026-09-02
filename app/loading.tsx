export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="h-44 animate-pulse rounded-3xl bg-white/8" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-white/8" />
        ))}
      </div>
      <div className="h-[34rem] animate-pulse rounded-[1.75rem] bg-emerald-950/50" />
      <p className="text-center text-sm text-white/50">Loading FPL squad…</p>
    </div>
  );
}
