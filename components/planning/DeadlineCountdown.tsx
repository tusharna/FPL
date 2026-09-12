"use client";

import { useEffect, useState } from "react";
import { formatDeadline } from "@/lib/format";

type DeadlineCountdownProps = {
  deadline: string | null;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) {
    return "Deadline passed";
  }

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m remaining`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  return `${minutes}m remaining`;
}

function computeCountdown(deadline: string | null): string {
  if (!deadline) {
    return "TBC";
  }
  return formatCountdown(Date.parse(deadline) - Date.now());
}

export function DeadlineCountdown({ deadline }: DeadlineCountdownProps) {
  const [countdown, setCountdown] = useState(() => computeCountdown(deadline));

  useEffect(() => {
    if (!deadline) {
      return;
    }

    const interval = setInterval(() => {
      setCountdown(computeCountdown(deadline));
    }, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <div className="flex flex-col gap-1">
      <p className="text-2xl font-semibold text-white">
        {formatDeadline(deadline)}
      </p>
      <p className="text-sm text-emerald-200/80">{countdown}</p>
    </div>
  );
}
