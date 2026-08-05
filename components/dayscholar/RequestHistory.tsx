import { StatusBadge } from "@/components/StatusPill";
import { slotLabel } from "@/lib/constants";
import { History, Inbox } from "lucide-react";

export default function RequestHistory({
  requests,
}: {
  requests: { id: string; status: string; created_at: string; meal_slot: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <History size={17} className="text-steel" strokeWidth={2} />
        <h2 className="font-display text-lg font-semibold">Your requests</h2>
      </div>
      <p className="text-xs text-steel">Requests disappear from here 48 hours after you submit them.</p>
      <div className="mt-4 space-y-2">
        {requests.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-steelLight py-8 text-center">
            <Inbox size={20} className="text-steel" strokeWidth={1.5} />
            <p className="text-sm text-steel">No requests yet.</p>
          </div>
        )}
        {requests.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between rounded-lg border border-steelLight bg-white px-4 py-3 transition-colors hover:border-steel/30"
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
