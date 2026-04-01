import { logout } from "@/app/actions/auth";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/20">
      <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-on-primary text-base">clinical_notes</span>
          </div>
          <span className="font-headline font-bold text-primary text-sm tracking-tight">
            FEES Dokumentation
          </span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-on-surface-variant hover:text-primary transition-colors font-medium min-h-[44px] px-2"
          >
            Abmelden
          </button>
        </form>
      </div>
    </header>
  );
}
