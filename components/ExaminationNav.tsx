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
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md rounded-t-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden">
      <div className="flex justify-around items-center px-4 pb-4 pt-2 w-full max-w-[900px] mx-auto">
        {steps.map((step) => {
          const isActive = step.key === activeStep;
          return (
            <Link
              key={step.key}
              href={step.href(examinationId, patientName)}
              className={`flex flex-col items-center justify-center px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-xl transition-all active:scale-90 duration-200 ${
                isActive
                  ? "bg-sky-100 text-sky-900"
                  : "text-slate-500 hover:text-sky-600"
              }`}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={
                  isActive
                    ? { fontVariationSettings: "'FILL' 1" }
                    : undefined
                }
              >
                {step.icon}
              </span>
              <span className="font-label text-[10px] font-semibold uppercase tracking-wider mt-1">
                {step.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
