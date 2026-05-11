"use client";

import type { AutoSaveStatus } from "@/hooks/useAutoSave";

interface SaveIndicatorProps {
  status: AutoSaveStatus;
  errorMessage?: string | null;
}

const CONFIG = {
  idle: { icon: null, text: null, className: "" },
  saving: {
    icon: "sync",
    text: "Speichert …",
    className: "text-on-surface-variant",
    spin: true,
  },
  saved: {
    icon: "cloud_done",
    text: "Gespeichert",
    className: "text-[#006e1c]",
    spin: false,
  },
  error: {
    icon: "cloud_off",
    text: "Nicht gespeichert",
    className: "text-[#a10012]",
    spin: false,
  },
} as const;

export default function SaveIndicator({ status, errorMessage }: SaveIndicatorProps) {
  if (status === "idle") return null;

  const cfg = CONFIG[status];

  return (
    <div
      className={`flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${cfg.className}`}
      title={status === "error" && errorMessage ? errorMessage : undefined}
    >
      {cfg.icon && (
        <span
          className={`material-symbols-outlined text-[16px] ${
            "spin" in cfg && cfg.spin ? "animate-spin" : ""
          }`}
        >
          {cfg.icon}
        </span>
      )}
      <span>{cfg.text}</span>
    </div>
  );
}
