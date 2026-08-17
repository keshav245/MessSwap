"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import Button from "@/components/Button";
import { MEAL_SLOTS, DAY_SCHOLAR_PRICE, slotLabel, slotTime, type MealSlot } from "@/lib/constants";
import { AlertCircle, IndianRupee, Loader2, SearchX, X } from "lucide-react";

type Listing = {
  id: string;
  meal_slot: string;
  expires_at: string;
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
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-steelLight py-10 text-center">
            <SearchX size={22} className="text-steel" strokeWidth={1.5} />
            <p className="text-sm text-steel">No meals available in this slot right now.</p>
          </div>
        )}
        {shown.map((l) => (
          <div key={l.id} className="stub stub-interactive flex items-center justify-between gap-3 p-5">
            <div>
              <p className="font-display text-base font-semibold">{slotLabel(l.meal_slot)}</p>
              <p className="text-sm text-steel">{slotTime(l.meal_slot)}</p>
            </div>
            <div className="text-right">
              <p className="flex items-center justify-end font-display text-lg font-semibold">
                <IndianRupee size={15} strokeWidth={2.5} />
                {DAY_SCHOLAR_PRICE}
              </p>
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
        <div className="animate-in fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <p className="font-display text-lg font-semibold">
                {slotLabel(claiming.meal_slot)} · ₹{DAY_SCHOLAR_PRICE}
              </p>
              <button
                onClick={() => setClaiming(null)}
                className="focus-ring rounded-full p-1 text-steel hover:bg-paper hover:text-ink"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
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
              <div className="mt-4 flex items-start gap-2 rounded-lg bg-chili/5 px-3 py-2.5 text-sm text-chili">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>The owner hasn't uploaded a payment QR yet — check back shortly.</span>
              </div>
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

            {error && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-chili/5 px-3 py-2.5 text-sm text-chili">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="primary" disabled={submitting} onClick={submitRequest} className="flex-1">
                {submitting && <Loader2 size={16} className="animate-spin" />}
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
