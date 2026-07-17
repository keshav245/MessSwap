"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import Button from "@/components/Button";
import { StatusBadge } from "@/components/StatusPill";
import { slotLabel, slotTime } from "@/lib/constants";

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
    <div className="stub flex flex-col sm:flex-row overflow-hidden">
      <div className="flex-1 p-5 sm:pr-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-lg font-semibold text-ink">{slotLabel(listing.meal_slot)}</p>
            <p className="text-sm text-steel">{slotTime(listing.meal_slot)}</p>
          </div>
          <StatusBadge status={listing.status} />
        </div>
        <p className="mt-2 text-xs text-steel">
          {listing.status === "available" ? timeLeft(listing.expires_at) : ""}
        </p>
        {canDelete && (
          <Button variant="ghost" className="mt-3 px-3 py-1 text-xs" disabled={busy} onClick={handleDelete}>
            Delete listing
          </Button>
        )}
      </div>
      <div className="flex items-center justify-center border-t sm:border-t-0 sm:border-l border-dashed border-steelLight px-5 py-4 sm:w-28">
        {qrPreview ? (
          <img src={qrPreview} alt="Your mess QR" className="h-16 w-16 rounded-lg object-cover" />
        ) : (
          <span className="text-[11px] text-steel">—</span>
        )}
      </div>
    </div>
  );
}
