"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";

export default function OwnerSettings({ currentQrUrl }: { currentQrUrl: string | null }) {
  const router = useRouter();
  const supabase = createClient();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const path = `owner/payment-qr.png`;
      await uploadImage(supabase, "site-assets", path, file);
      const { error: dbError } = await supabase
        .from("settings")
        .upsert({ key: "owner_payment_qr_path", value: path });
      if (dbError) throw dbError;
      router.refresh();
    } catch (err: any) {
      setError(err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="stub p-5">
      <p className="font-display text-base font-semibold">Your payment QR</p>
      <p className="mt-1 text-sm text-steel">
        Shown to every day scholar when they go to pay ₹40 for a meal.
      </p>
      <div className="mt-4 flex items-center gap-4">
        {currentQrUrl ? (
          <img src={currentQrUrl} alt="Your payment QR" className="h-24 w-24 rounded-lg border border-steelLight object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
            No QR yet
          </div>
        )}
        <label>
          <span className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink hover:border-ink/50">
            {uploading ? "Uploading…" : currentQrUrl ? "Replace" : "Upload"}
          </span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>
      {error && <p className="mt-3 text-sm text-chili">{error}</p>}
    </div>
  );
}
