"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";
import Button from "@/components/Button";
import { StatusBadge } from "@/components/StatusPill";
import { slotLabel } from "@/lib/constants";

export type AdminRequest = {
  id: string;
  status: string;
  created_at: string;
  payment_screenshot_path: string;
  listing: { id: string; meal_slot: string; hosteller_id: string; hosteller: { full_name: string; phone: string | null } | null } | null;
  day_scholar: { full_name: string; phone: string | null; email: string | null } | null;
};

function Thumb({ src, label }: { src: string | null; label: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-steel">{label}</p>
      {src ? (
        <img src={src} alt={label} className="mt-1 h-28 w-28 rounded-lg border border-steelLight object-cover" />
      ) : (
        <div className="mt-1 flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
          Not available
        </div>
      )}
    </div>
  );
}

export default function RequestReviewCard({ request }: { request: AdminRequest }) {
  const router = useRouter();
  const supabase = createClient();
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [listingQrUrl, setListingQrUrl] = useState<string | null>(null);
  const [payoutQrUrl, setPayoutQrUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    signedUrl(supabase, "payment-screenshots", request.payment_screenshot_path).then(
      (url) => active && setScreenshotUrl(url)
    );

    if (request.listing) {
      supabase
        .from("listing_qr")
        .select("image_path")
        .eq("listing_id", request.listing.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.image_path && active) {
            setListingQrUrl(supabase.storage.from("qr-codes").getPublicUrl(data.image_path).data.publicUrl);
          }
        });

      supabase
        .from("profiles")
        .select("payout_qr_path")
        .eq("id", request.listing.hosteller_id)
        .maybeSingle()
        .then(async ({ data }) => {
          if (data?.payout_qr_path && active) {
            const url = await signedUrl(supabase, "payout-qr", data.payout_qr_path);
            if (active) setPayoutQrUrl(url);
          }
        });
    }

    return () => {
      active = false;
    };
  }, [request.id]);

  async function decide(decision: "approved" | "rejected") {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc(decision === "approved" ? "approve_request" : "reject_request", {
      p_request_id: request.id,
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  if (!request.listing) return null;

  return (
    <div className="stub p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-sm font-semibold text-ink">
            {request.day_scholar?.full_name ?? "Unknown"} → {request.listing.hosteller?.full_name ?? "Unknown"}
          </p>
          <p className="mt-0.5 text-xs text-steel">
            {slotLabel(request.listing.meal_slot)} ·{" "}
            {new Date(request.created_at).toLocaleString("en-IN", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            })}
          </p>
          {request.day_scholar?.phone && <p className="text-xs text-steel">{request.day_scholar.phone}</p>}
        </div>
        <StatusBadge status={request.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <Thumb src={screenshotUrl} label="Payment screenshot" />
        <Thumb src={listingQrUrl} label="Mess QR" />
        <Thumb src={payoutQrUrl} label="Hosteller payout QR" />
      </div>

      {error && <p className="mt-3 text-sm text-chili">{error}</p>}

      {request.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button variant="primary" disabled={busy} onClick={() => decide("approved")}>
            Approve — releases QR, credits ₹30
          </Button>
          <Button variant="danger" disabled={busy} onClick={() => decide("rejected")}>
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
