const statusStyles: Record<string, string> = {
  available: "bg-chutney/10 text-chutney",
  pending: "bg-turmeric/15 text-turmericDark",
  used: "bg-steel/10 text-steel",
  expired: "bg-steel/10 text-steel",
  cancelled: "bg-chili/10 text-chili",
  approved: "bg-chutney/10 text-chutney",
  rejected: "bg-chili/10 text-chili",
};

const statusText: Record<string, string> = {
  available: "Not used",
  pending: "Pending",
  used: "Used",
  expired: "Expired",
  cancelled: "Cancelled",
  approved: "Approved",
  rejected: "Rejected",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-medium font-body uppercase tracking-wide ${
        statusStyles[status] ?? "bg-steel/10 text-steel"
      }`}
    >
      {statusText[status] ?? status}
    </span>
  );
}
