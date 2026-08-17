"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import Button from "@/components/Button";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, X } from "lucide-react";

export type DirectoryUser = {
  id: string;
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  earnings_total: number;
  payout_qr_path: string | null;
  listingsCount: number;
  requestsCount: number;
};

function RoleBadge({ role }: { role: string }) {
  if (role === "hosteller") {
    return <span className="rounded-full bg-chili px-3 py-1 text-xs font-medium text-white">Hostler</span>;
  }
  if (role === "admin") {
    return <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Owner</span>;
  }
  return (
    <span className="rounded-full border border-steelLight bg-paper px-3 py-1 text-xs font-medium text-ink">
      Day Scholar
    </span>
  );
}

export default function UserCard({ user, adminId }: { user: DirectoryUser; adminId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(!!user.payout_qr_path);
  const [messaging, setMessaging] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user.role === "hosteller" && user.payout_qr_path) {
      signedUrl(supabase, "payout-qr", user.payout_qr_path).then((url) => {
        setQrPreview(url);
        setQrLoading(false);
      });
    } else {
      setQrLoading(false);
    }
  }, [user.payout_qr_path, user.role]);

  async function sendMessage() {
    if (!body.trim()) {
      setError("Write a message first.");
      return;
    }
    setSending(true);
    setError(null);

    const { error } = await supabase.from("messages").insert({
      sender_id: adminId,
      recipient_id: user.id,
      audience: "direct",
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
    setTimeout(() => {
      setSent(false);
      setMessaging(false);
    }, 1200);
  }

  return (
    <div className="stub stub-interactive p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-steelLight bg-paper font-display text-sm font-semibold text-steel">
            {user.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">{user.full_name}</p>
            {user.email && <p className="text-xs text-steel">{user.email}</p>}
          </div>
        </div>
        <RoleBadge role={user.role} />
      </div>

      <div className="mt-3 space-y-1 text-xs text-steel">
        {user.phone && <p>{user.phone}</p>}
        {user.role === "hosteller" && (
          <p>
            {user.listingsCount} listings · ₹{user.earnings_total} earned
          </p>
        )}
        {user.role === "day_scholar" && <p>{user.requestsCount} requests</p>}
      </div>

      {user.role === "hosteller" && (
        <div className="mt-3">
          {qrLoading ? (
            <div className="skeleton h-20 w-20 rounded-lg" />
          ) : qrPreview ? (
            <img src={qrPreview} alt={`${user.full_name}'s payout QR`} className="h-20 w-20 rounded-lg border border-steelLight object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
              No payout QR
            </div>
          )}
        </div>
      )}

      {user.role !== "admin" && (
        <div className="mt-3">
          {!messaging ? (
            <Button variant="secondary" className="gap-1.5 px-3 py-1.5 text-xs" onClick={() => setMessaging(true)}>
              <MessageCircle size={13} />
              Message
            </Button>
          ) : (
            <div className="rounded-lg border border-steelLight bg-paper p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-steel">To {user.full_name}</p>
                <button
                  onClick={() => setMessaging(false)}
                  className="focus-ring rounded-full p-0.5 text-steel hover:text-ink"
                  aria-label="Close"
                >
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Type a message…"
                rows={2}
                className="focus-ring mt-2 w-full resize-none rounded-lg border border-steelLight bg-white px-3 py-2 text-sm text-ink placeholder:text-steel/60"
              />
              {error && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-chili">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {sent && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-chutney">
                  <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
                  <span>Sent.</span>
                </div>
              )}
              <Button variant="primary" disabled={sending} onClick={sendMessage} className="mt-2 px-3 py-1.5 text-xs">
                {sending && <Loader2 size={13} className="animate-spin" />}
                {sending ? "Sending…" : "Send"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
