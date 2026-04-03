"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

type Step = "stammdaten" | "befund" | "schlucktest" | "export";

const NAV_STEPS: { key: Step; label: string; pattern: RegExp }[] = [
  { key: "stammdaten", label: "STAMMDATEN", pattern: /\/examination\/(new|[^/]+\/stammdaten)/ },
  { key: "befund",      label: "BEFUND",      pattern: /\/examination\/[^/]+\/befund/ },
  { key: "schlucktest", label: "SCHLUCKTEST", pattern: /\/examination\/[^/]+\/schlucktest/ },
  { key: "export",      label: "EXPORT",      pattern: /\/examination\/[^/]+\/export/ },
];

function getActiveStep(pathname: string): Step | null {
  for (const s of NAV_STEPS) {
    if (s.pattern.test(pathname)) return s.key;
  }
  return null;
}

function getStepNumber(step: Step | null): number {
  const map: Record<Step, number> = { stammdaten: 0, befund: 1, schlucktest: 2, export: 3 };
  return step !== null ? map[step] : -1;
}

function getExamId(pathname: string): string | null {
  const m = pathname.match(/\/examination\/([^/]+)/);
  return m ? m[1] : null;
}

export default function Header() {
  const pathname = usePathname();
  const activeStep = getActiveStep(pathname);
  const stepIndex = getStepNumber(activeStep);
  const isExamination = activeStep !== null || pathname.startsWith("/examination/new");
  const examId = getExamId(pathname);

  function stepHref(key: Step): string {
    if (key === "stammdaten") return "/examination/new";
    if (!examId) return "#";
    const map: Record<Step, string> = {
      stammdaten: "/examination/new",
      befund: `/examination/${examId}/befund`,
      schlucktest: `/examination/${examId}/schlucktest`,
      export: `/examination/${examId}/export`,
    };
    return map[key];
  }

  return (
    // Gesamthöhe: h-14 (56px) + pb-2 (8px) + h-1 (4px) = 68px — immer konstant
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="max-w-[900px] mx-auto px-4">

        {/* Zeile 1: Logo + Tab-Nav + Step + Logout — 56px */}
        <div className="h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              clinical_notes
            </span>
            <span className="font-headline font-bold text-lg tracking-tight text-primary">
              FEES Optimizer
            </span>
          </div>

          {/* Desktop Tab-Nav — nur auf Examination-Seiten */}
          {isExamination && (
            <nav className="hidden lg:flex items-center gap-8 h-full">
              {NAV_STEPS.map((s) => {
                const isActive = s.key === activeStep;
                return (
                  <Link
                    key={s.key}
                    href={stepHref(s.key)}
                    className={`font-headline font-semibold text-sm h-full flex items-center transition-colors ${
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-on-surface-variant hover:text-primary"
                    }`}
                  >
                    {s.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Step-Label (mobile) + Logout */}
          <div className="flex items-center gap-1">
            {isExamination && stepIndex >= 0 && (
              <span className="text-on-surface-variant font-label text-sm font-medium lg:hidden">
                Schritt {stepIndex + 1} von 4
              </span>
            )}
            <form action={logout}>
              <button
                type="submit"
                className="p-2 hover:bg-surface-container rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Abmelden"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                  logout
                </span>
              </button>
            </form>
          </div>
        </div>

        {/* Zeile 2: Progress-Bar — immer 12px hoch (4px Bar + 8px Abstand), hält Header-Höhe konstant */}
        <div className="pb-2 flex gap-1">
          {isExamination && stepIndex >= 0 ? (
            [0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-primary" : "bg-outline-variant"
                }`}
              />
            ))
          ) : (
            // Platzhalter: hält Höhe, damit pt-[68px] im Layout immer stimmt
            <div className="h-1 w-full" />
          )}
        </div>

      </div>
    </header>
  );
}
