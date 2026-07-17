"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";

export default function DashboardNav({
  fullName,
  roleLabel,
}: {
  fullName: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-steelLight bg-white/60">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">MessSwap</p>
          <p className="text-xs text-steel">
            {fullName} · {roleLabel}
          </p>
        </div>
        <Button variant="ghost" onClick={signOut}>
          Sign out
        </Button>
      </div>
    </header>
  );
}
