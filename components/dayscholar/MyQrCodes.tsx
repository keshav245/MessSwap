import { slotLabel } from "@/lib/constants";
import { Download, ExternalLink, Sparkles } from "lucide-react";

export default function MyQrCodes({
  items,
}: {
  items: { requestId: string; mealSlot: string; qrUrl: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-turmericDark" strokeWidth={2} />
        <h2 className="font-display text-lg font-semibold">Your meal QR codes</h2>
      </div>
      <p className="text-sm text-steel">Approved and ready to use. Removed 48 hours after you requested them.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <div
            key={item.requestId}
            className="stub stub-interactive animate-in p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="font-display text-base font-semibold">{slotLabel(item.mealSlot)}</p>
            <img
              src={item.qrUrl}
              alt={`${slotLabel(item.mealSlot)} mess QR`}
              className="mt-3 h-48 w-48 rounded-lg border border-steelLight object-cover"
            />
            <div className="mt-3 flex gap-2">
              <a
                href={item.qrUrl}
                target="_blank"
                rel="noreferrer"
                className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full border border-ink/20 px-4 py-2 text-center text-xs font-medium text-ink transition-colors hover:border-ink/50 hover:bg-ink/5"
              >
                <ExternalLink size={13} />
                Open
              </a>
              <a
                href={item.qrUrl}
                download
                className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2 text-center text-xs font-medium text-paper transition-colors hover:bg-turmericDark"
              >
                <Download size={13} />
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
