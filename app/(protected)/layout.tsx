import Header from "@/components/Header";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      {/* pt-[68px]: h-14 (56px) Logo-Zeile + 4px Bar + 8px Abstand = 68px Header */}
      <main className="flex-1 pt-[68px] max-w-[900px] mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
