export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="h-20 animate-pulse rounded-2xl bg-white/10" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-xl bg-white/10" />
        ))}
      </div>
      <div className="h-[28rem] animate-pulse rounded-2xl bg-emerald-950/40" />
      <p className="text-center text-sm text-white/50">Loading FPL squad…</p>
    </div>
  );
}
