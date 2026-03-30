import { logout } from "@/app/actions/auth";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Logo-Platzhalter */}
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-xs font-bold">F</span>
        </div>
        <span className="font-semibold text-gray-800 text-sm">
          FEES Dokumentation
        </span>
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Abmelden
        </button>
      </form>
    </header>
  );
}
