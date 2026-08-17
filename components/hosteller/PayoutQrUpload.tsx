"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage, signedUrl } from "@/lib/storage";
import { AlertCircle, IndianRupee, Loader2, QrCode, Wallet } from "lucide-react";

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
  const [previewLoading, setPreviewLoading] = useState(!!existingPath);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!existingPath) {
      setPreviewLoading(false);
      return;
    }
    signedUrl(supabase, "payout-qr", existingPath).then((url) => {
      setPreview(url);
      setPreviewLoading(false);
    });
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chutney/10 text-chutney">
            <Wallet size={17} strokeWidth={2} />
          </span>
          <div>
            <p className="font-display text-base font-semibold">Your payout QR</p>
            <p className="mt-0.5 text-sm text-steel">
              So the owner can pay you ₹30 per meal used. Only visible to you and the owner.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-steel">Total earned</p>
          <p className="flex items-center justify-end font-display text-xl font-semibold text-chutney">
            <IndianRupee size={16} strokeWidth={2.5} />
            {earningsTotal}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-4">
        {previewLoading ? (
          <div className="skeleton h-20 w-20 rounded-lg" />
        ) : preview ? (
          <img src={preview} alt="Your payout QR" className="h-20 w-20 rounded-lg border border-steelLight object-cover" />
        ) : (
          <div className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
            <QrCode size={18} strokeWidth={1.5} />
            No QR yet
          </div>
        )}
        <label>
          <span className="focus-ring inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/50 hover:bg-ink/5">
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? "Uploading…" : preview ? "Replace" : "Upload"}
          </span>
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} className="hidden" />
        </label>
      </div>

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-chili/5 px-3 py-2.5 text-sm text-chili">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
