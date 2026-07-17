"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import Button from "@/components/Button";
import { MEAL_SLOTS, type MealSlot } from "@/lib/constants";

export default function PostListingForm({ hostellerId }: { hostellerId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please choose a PNG of your mess QR.");
      return;
    }
    setLoading(true);
    setError(null);

    const { data: listing, error: insertError } = await supabase
      .from("listings")
      .insert({ hosteller_id: hostellerId, meal_slot: slot })
      .select("id")
      .single();

    if (insertError || !listing) {
      setError(insertError?.message ?? "Could not create the listing.");
      setLoading(false);
      return;
    }

    try {
      const path = `${hostellerId}/${listing.id}.png`;
      await uploadImage(supabase, "qr-codes", path, file);

      const { error: qrError } = await supabase
        .from("listing_qr")
        .insert({ listing_id: listing.id, image_path: path });
      if (qrError) throw qrError;
    } catch (err: any) {
      // Roll back the orphaned listing if the QR upload/link failed.
      await supabase.from("listings").delete().eq("id", listing.id);
      setError(err.message ?? "Could not upload the QR.");
      setLoading(false);
      return;
    }

    setFile(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="stub p-5">
      <p className="font-display text-base font-semibold">Post a spare meal</p>
      <p className="mt-1 text-sm text-steel">
        Pick the slot and upload your mess QR as a PNG. It stays live for 12 hours.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {MEAL_SLOTS.map((s) => (
          <button
            type="button"
            key={s.value}
            onClick={() => setSlot(s.value)}
            className={`focus-ring rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
              slot === s.value
                ? "border-ink bg-ink text-paper"
                : "border-steelLight bg-white text-ink hover:border-ink/40"
            }`}
          >
            <span className="block font-medium">{s.label}</span>
            <span className={`block text-[11px] ${slot === s.value ? "text-paper/70" : "text-steel"}`}>
              {s.time}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-xs font-medium uppercase tracking-wide text-steel mb-1.5">
          Mess QR (PNG)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="focus-ring block w-full text-sm text-steel file:mr-4 file:rounded-full file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-paper"
        />
      </div>

      {error && <p className="mt-3 text-sm text-chili">{error}</p>}

      <Button type="submit" disabled={loading} className="mt-4">
        {loading ? "Posting…" : "Post listing"}
      </Button>
    </form>
  );
}
