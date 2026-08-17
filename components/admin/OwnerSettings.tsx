"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { uploadImage } from "@/lib/storage";
import { AlertCircle, Loader2, QrCode, Settings } from "lucide-react";

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
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-paper">
          <Settings size={16} strokeWidth={2} />
        </span>
        <div>
          <p className="font-display text-base font-semibold">Your payment QR</p>
          <p className="mt-0.5 text-sm text-steel">
            Shown to every day scholar when they go to pay ₹40 for a meal.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4">
        {currentQrUrl ? (
          <img src={currentQrUrl} alt="Your payment QR" className="h-24 w-24 rounded-lg border border-steelLight object-cover" />
        ) : (
          <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
            <QrCode size={18} strokeWidth={1.5} />
            No QR yet
          </div>
        )}
        <label>
          <span className="focus-ring inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full border border-ink/20 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-ink/50 hover:bg-ink/5">
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading ? "Uploading…" : currentQrUrl ? "Replace" : "Upload"}
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
