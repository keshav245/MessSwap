import { StatusBadge } from "@/components/StatusPill";
import { slotLabel } from "@/lib/constants";

export default function RequestHistory({
  requests,
}: {
  requests: { id: string; status: string; created_at: string; meal_slot: string }[];
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">Your requests</h2>
      <div className="mt-4 space-y-2">
        {requests.length === 0 && <p className="text-sm text-steel">No requests yet.</p>}
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-steelLight bg-white px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">{slotLabel(r.meal_slot)}</p>
              <p className="text-xs text-steel">
                {new Date(r.created_at).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <StatusBadge status={r.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
