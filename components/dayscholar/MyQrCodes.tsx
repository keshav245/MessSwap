import { slotLabel } from "@/lib/constants";

export default function MyQrCodes({
  items,
}: {
  items: { requestId: string; mealSlot: string; qrUrl: string }[];
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="font-display text-lg font-semibold">Your meal QR codes</h2>
      <p className="text-sm text-steel">Approved and ready to use.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.requestId} className="stub p-5">
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
                className="focus-ring flex-1 rounded-full border border-ink/20 px-4 py-2 text-center text-xs font-medium text-ink hover:border-ink/50"
              >
                Open
              </a>
              <a
                href={item.qrUrl}
                download
                className="focus-ring flex-1 rounded-full bg-ink px-4 py-2 text-center text-xs font-medium text-paper hover:bg-turmericDark"
              >
                Download
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
