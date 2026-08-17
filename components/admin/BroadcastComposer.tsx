"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/Button";
import { AlertCircle, CheckCircle2, Loader2, Megaphone } from "lucide-react";

const audiences = [
  { value: "everyone", label: "Everyone" },
  { value: "all_hostellers", label: "All hostellers" },
  { value: "all_day_scholars", label: "All day scholars" },
] as const;

export default function BroadcastComposer({ adminId }: { adminId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [audience, setAudience] = useState<(typeof audiences)[number]["value"]>("everyone");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    if (!body.trim()) {
      setError("Write a message first.");
      return;
    }
    setSending(true);
    setError(null);
    setSent(false);

    const { error } = await supabase.from("messages").insert({
      sender_id: adminId,
      audience,
      body: body.trim(),
    });

    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
    setSent(true);
    router.refresh();
    setTimeout(() => setSent(false), 3000);
  }

  return (
    <div className="stub p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-turmeric/15 text-turmericDark">
          <Megaphone size={17} strokeWidth={2} />
        </span>
        <div>
          <p className="font-display text-base font-semibold">Send a broadcast</p>
          <p className="mt-0.5 text-sm text-steel">Reaches everyone's dashboard inbox instantly.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {audiences.map((a) => (
          <button
            key={a.value}
            type="button"
            onClick={() => setAudience(a.value)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              audience === a.value ? "bg-ink text-paper" : "border border-steelLight bg-white text-ink"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="e.g. Payments will be delayed today until 8pm."
        rows={3}
        className="focus-ring mt-3 w-full resize-none rounded-lg border border-steelLight bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-steel/60"
      />

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-chili/5 px-3 py-2.5 text-sm text-chili">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {sent && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-chutney/10 px-3 py-2.5 text-sm text-chutney">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>Sent.</span>
        </div>
      )}

      <Button variant="primary" disabled={sending} onClick={send} className="mt-3">
        {sending && <Loader2 size={16} className="animate-spin" />}
        {sending ? "Sending…" : "Send broadcast"}
      </Button>
    </div>
  );
}
