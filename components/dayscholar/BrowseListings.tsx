"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import Button from "@/components/Button";
import { MEAL_SLOTS, DAY_SCHOLAR_PRICE, slotLabel, slotTime, type MealSlot } from "@/lib/constants";

type Listing = {
  id: string;
  meal_slot: string;
  expires_at: string;
  hosteller: { full_name: string } | null;
};

export default function BrowseListings({
  listings,
  ownerQrUrl,
  dayScholarId,
}: {
  listings: Listing[];
  ownerQrUrl: string | null;
  dayScholarId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [filter, setFilter] = useState<MealSlot | "all">("all");
  const [claiming, setClaiming] = useState<Listing | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shown = useMemo(
    () => (filter === "all" ? listings : listings.filter((l) => l.meal_slot === filter)),
    [filter, listings]
  );

  async function submitRequest() {
    if (!claiming || !file) {
      setError("Please attach your payment screenshot.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const path = `${dayScholarId}/${claiming.id}-${Date.now()}.png`;
      await uploadImage(supabase, "payment-screenshots", path, file);

      const { error: rpcError } = await supabase.rpc("create_request", {
        p_listing_id: claiming.id,
        p_payment_screenshot_path: path,
      });
      if (rpcError) throw rpcError;

      fetch("/api/notify-owner", { method: "POST" }).catch(() => {});

      setClaiming(null);
      setFile(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("all")}
          className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            filter === "all" ? "bg-ink text-paper" : "border border-steelLight bg-white text-ink"
          }`}
        >
          All
        </button>
        {MEAL_SLOTS.map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={`focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              filter === s.value ? "bg-ink text-paper" : "border border-steelLight bg-white text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {shown.length === 0 && (
          <p className="text-sm text-steel">No meals available in this slot right now.</p>
        )}
        {shown.map((l) => (
          <div key={l.id} className="stub flex items-center justify-between gap-3 p-5">
            <div>
              <p className="font-display text-base font-semibold">{slotLabel(l.meal_slot)}</p>
              <p className="text-sm text-steel">{slotTime(l.meal_slot)}</p>
              {l.hosteller?.full_name && (
                <p className="mt-1 text-xs text-steel">from {l.hosteller.full_name}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-display text-lg font-semibold">₹{DAY_SCHOLAR_PRICE}</p>
              <Button
                variant="primary"
                className="mt-2 px-4 py-1.5 text-xs"
                onClick={() => {
                  setClaiming(l);
                  setError(null);
                }}
              >
                Request
              </Button>
            </div>
          </div>
        ))}
      </div>

      {claiming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6">
            <p className="font-display text-lg font-semibold">
              {slotLabel(claiming.meal_slot)} · ₹{DAY_SCHOLAR_PRICE}
            </p>
            <p className="mt-1 text-sm text-steel">
              Scan the owner's QR below, pay ₹{DAY_SCHOLAR_PRICE}, then upload your payment
              screenshot to confirm.
            </p>

            {ownerQrUrl ? (
              <img
                src={ownerQrUrl}
                alt="Owner's payment QR"
                className="mx-auto mt-4 h-44 w-44 rounded-lg border border-steelLight object-cover"
              />
            ) : (
              <p className="mt-4 text-sm text-chili">
                The owner hasn't uploaded a payment QR yet — check back shortly.
              </p>
            )}

            <div className="mt-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-steel mb-1.5">
                Payment screenshot
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="focus-ring block w-full text-sm text-steel file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-paper"
              />
            </div>

            {error && <p className="mt-3 text-sm text-chili">{error}</p>}

            <div className="mt-5 flex gap-2">
              <Button variant="primary" disabled={submitting} onClick={submitRequest} className="flex-1">
                {submitting ? "Submitting…" : "Submit request"}
              </Button>
              <Button variant="ghost" onClick={() => setClaiming(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
