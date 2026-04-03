"use client";

import { useRouter } from "next/navigation";

interface StickyFooterProps {
  /** URL für den Zurück-Button. Falls undefined: router.back() */
  backHref?: string;
  /** Label für den Zurück-Button (default: "← Zurück") */
  backLabel?: string;
  /** Label für den rechten Primary-Button */
  submitLabel?: string;
  /** Ist der Submit-Button deaktiviert? */
  disabled?: boolean;
  /** Wird der Submit gerade verarbeitet? */
  loading?: boolean;
  /** onClick für den Submit-Button. Falls nicht gesetzt: type="submit" im nächsten form */
  onSubmit?: () => void;
  /** Formular-ID, falls der Button ein externes <form> submitten soll */
  formId?: string;
  /** Icon rechts neben dem Submit-Label */
  submitIcon?: string;
}

export default function StickyFooter({
  backHref,
  backLabel = "← Zurück",
  submitLabel = "Speichern & Weiter",
  disabled = false,
  loading = false,
  onSubmit,
  formId,
  submitIcon = "arrow_forward",
}: StickyFooterProps) {
  const router = useRouter();

  function handleBack() {
    if (backHref) router.push(backHref);
    else router.back();
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant/30 p-4 z-50">
      <div className="max-w-[900px] mx-auto flex justify-between items-center gap-4">
        {/* Zurück */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center justify-center px-6 min-h-[44px] text-primary font-bold text-sm hover:bg-primary/5 rounded-xl transition-colors"
        >
          {backLabel}
        </button>

        {/* Speichern & Weiter */}
        <button
          type={onSubmit ? "button" : "submit"}
          form={formId}
          onClick={onSubmit}
          disabled={disabled || loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 min-h-[44px] bg-primary text-white font-headline font-bold text-sm rounded-xl shadow-lg shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {loading ? "Speichern …" : submitLabel}
          {!loading && submitIcon && (
            <span className="material-symbols-outlined text-base">{submitIcon}</span>
          )}
        </button>
      </div>
    </nav>
  );
}
