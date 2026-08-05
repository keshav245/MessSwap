"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import Button from "@/components/Button";
import { StatusBadge } from "@/components/StatusPill";
import { slotLabel, slotTime } from "@/lib/constants";
import { Clock, Trash2 } from "lucide-react";

function timeLeft(expiresAt: string) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m left`;
}

export default function ListingRow({
  listing,
}: {
  listing: { id: string; meal_slot: string; status: string; created_at: string; expires_at: string };
}) {
  const router = useRouter();
  const supabase = createClient();
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("listing_qr")
        .select("image_path")
        .eq("listing_id", listing.id)
        .maybeSingle();
      if (data?.image_path) {
        const url = supabase.storage.from("qr-codes").getPublicUrl(data.image_path).data.publicUrl;
        if (active) setQrPreview(url);
      }
      if (active) setQrLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [listing.id]);

  const canDelete = ["available", "expired", "cancelled"].includes(listing.status);

  async function handleDelete() {
    setBusy(true);
    await supabase.from("listings").delete().eq("id", listing.id);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="stub stub-interactive flex flex-col overflow-hidden sm:flex-row">
      <div className="flex-1 p-5 sm:pr-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink">{slotLabel(listing.meal_slot)}</p>
            <p className="text-sm text-steel">{slotTime(listing.meal_slot)}</p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        {listing.status === "available" && (
          <p className="mt-2 flex items-center gap-1 text-xs text-steel">
            <Clock size={12} />
            {timeLeft(listing.expires_at)}
          </p>
        )}
        {canDelete && (
          <Button variant="ghost" className="mt-3 gap-1 px-3 py-1 text-xs" disabled={busy} onClick={handleDelete}>
            <Trash2 size={13} />
            Delete listing
          </Button>
        )}
      </div>
      <div className="flex items-center justify-center border-t border-dashed border-steelLight px-5 py-4 sm:w-28 sm:border-l sm:border-t-0">
        {qrLoading ? (
          <div className="skeleton h-16 w-16 rounded-lg" />
        ) : qrPreview ? (
          <img src={qrPreview} alt="Your mess QR" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <span className="text-[11px] text-steel">—</span>
        )}
      </div>
    </div>
  );
}
