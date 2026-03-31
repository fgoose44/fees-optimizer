"use client";

import Link from "next/link";

type Step = "stammdaten" | "befund" | "schlucktest" | "export";

interface ExaminationNavProps {
  examinationId: string;
  patientName: string;
  activeStep: Step;
}

const steps: { key: Step; label: string; icon: string; href: (id: string, pn: string) => string }[] = [
  {
    key: "stammdaten",
    label: "STAMMDATEN",
    icon: "assignment",
    href: (id) => `/examination/${id}/stammdaten`,
  },
  {
    key: "befund",
    label: "BEFUND",
    icon: "medical_services",
    href: (id, pn) => `/examination/${id}/befund?patientName=${encodeURIComponent(pn)}`,
  },
  {
    key: "schlucktest",
    label: "SCHLUCKTEST",
    icon: "water_drop",
    href: (id, pn) => `/examination/${id}/schlucktest?patientName=${encodeURIComponent(pn)}`,
  },
  {
    key: "export",
    label: "EXPORT",
    icon: "description",
    href: (id, pn) => `/examination/${id}/export?patientName=${encodeURIComponent(pn)}`,
  },
];

export default function ExaminationNav({
  examinationId,
  patientName,
  activeStep,
}: ExaminationNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface-container-lowest/80 backdrop-blur-md border-t border-outline-variant/20 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)]">
      {steps.map((step) => {
        const isActive = step.key === activeStep;
        return (
          <Link
            key={step.key}
            href={step.href(examinationId, patientName)}
            className={`flex flex-col items-center justify-center px-3 py-2 min-h-[44px] min-w-[44px] rounded-xl transition-all ${
              isActive
                ? "bg-primary/10 text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined mb-1 text-[22px]"
              style={
                isActive
                  ? { fontVariationSettings: "'FILL' 1" }
                  : undefined
              }
            >
              {step.icon}
            </span>
            <span
              className={`font-label text-[11px] tracking-wide font-${isActive ? "bold" : "medium"}`}
            >
              {step.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
