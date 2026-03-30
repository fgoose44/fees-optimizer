import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-800">Übersicht</h1>
        <p className="text-sm text-gray-500 mt-1">
          Willkommen bei der FEES-Dokumentation.
        </p>
      </div>

      <Link
        href="/examination/new"
        className="block w-full bg-blue-600 text-white text-center rounded-xl py-4 font-medium hover:bg-blue-700 transition-colors"
      >
        + Neue Untersuchung
      </Link>
    </div>
  );
}
