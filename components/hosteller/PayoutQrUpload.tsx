"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, signedUrl } from "@/lib/storage";

export default function PayoutQrUpload({
  hostellerId,
  existingPath,
  earningsTotal,
}: {
  hostellerId: string;
  existingPath: string | null;
  earningsTotal: number;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingPath) return;
    signedUrl(supabase, "payout-qr", existingPath).then(setPreview);
  }, [existingPath]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const path = `${hostellerId}/payout.png`;
      await uploadImage(supabase, "payout-qr", path, file);
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ payout_qr_path: path })
        .eq("id", hostellerId);
      if (dbError) throw dbError;
      setPreview(await signedUrl(supabase, "payout-qr", path));
    } catch (err: any) {
      setError(err.message ?? "Upload failed.");
    } finally {
      setUploading(false);
      router.refresh();
    }
  }

  return (
    <div className="stub p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold">Your payout QR</p>
          <p className="mt-1 text-sm text-steel">
            So the owner can pay you ₹30 per meal used. Only visible to you and the owner.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-steel">Total earned</p>
          <p className="font-display text-xl font-semibold text-chutney">₹{earningsTotal}</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="Your payout QR" className="h-20 w-20 rounded-lg border border-steelLight object-cover" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
            No QR yet
          </div>
        )}
        <label>
          <span className="focus-ring inline-flex cursor-pointer items-center justify-center rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink hover:border-ink/50">
            {uploading ? "Uploading…" : preview ? "Replace" : "Upload"}
          </span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>

      {error && <p className="mt-3 text-sm text-chili">{error}</p>}
    </div>
  );
}
