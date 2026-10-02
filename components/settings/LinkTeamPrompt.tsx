import { TeamSettings } from "@/components/settings/TeamSettings";

type LinkTeamPromptProps = {
  email: string | null;
};

export function LinkTeamPrompt({ email }: LinkTeamPromptProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-16">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
          FPL Command Center
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white">
          Link your FPL team
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          {email ? `${email} is signed in.` : "You are signed in."} Add the team ID
          from your Fantasy Premier League team URL so the dashboard can load your squad.
        </p>
      </div>
      <TeamSettings redirectOnSave />
    </div>
  );
}
