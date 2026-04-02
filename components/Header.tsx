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

  // Href für Desktop-Tab-Nav
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
    <header className="fixed top-0 w-full z-50 bg-white/40 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="max-w-[900px] mx-auto px-4 h-16 flex flex-col justify-center">
        {/* Zeile 1: Logo + Step-Info + Icons */}
        <div className="flex items-center justify-between mb-1.5">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-primary text-2xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              clinical_notes
            </span>
            <span className="font-headline font-bold text-lg tracking-tight text-primary">
              FEES Analytics
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
                        ? "text-primary border-b-2 border-primary pb-px"
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

        {/* Zeile 2: Progress-Bar (nur Examination-Seiten) */}
        {isExamination && stepIndex >= 0 && (
          <div className="flex gap-1 h-1 w-full">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-primary" : "bg-outline-variant"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
