"use client";

import { useMemo, useState } from "react";
import OwnerSettings from "@/components/admin/OwnerSettings";
import UserCard, { type DirectoryUser } from "@/components/admin/UserCard";
import RequestReviewCard, { type AdminRequest } from "@/components/admin/RequestReviewCard";

const roleSearchLabel: Record<string, string> = {
  hosteller: "hostler",
  day_scholar: "day scholar",
  admin: "owner",
};

export default function OwnerConsole({
  users,
  requests,
  ownerQrUrl,
}: {
  users: DirectoryUser[];
  requests: AdminRequest[];
  ownerQrUrl: string | null;
}) {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.full_name, u.email, u.phone, roleSearchLabel[u.role]]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q))
    );
  }, [search, users]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      rejected: requests.filter((r) => r.status === "rejected").length,
    }),
    [requests]
  );

  const shownRequests = requests.filter((r) => r.status === tab);

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Owner console</h1>
      <p className="mt-1 text-sm text-steel">
        Review day scholar requests, verify payment, approve to release the mess QR.
      </p>

      <div className="mt-8">
        <OwnerSettings currentQrUrl={ownerQrUrl} />
      </div>

      <div className="mt-10">
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`focus-ring flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? "bg-chili text-white" : "border border-steelLight bg-white text-ink"
              }`}
            >
              {t}
              <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t ? "bg-white/20" : "bg-paper"}`}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {shownRequests.length > 0 ? (
            shownRequests.map((r) => <RequestReviewCard key={r.id} request={r} />)
          ) : (
            <div className="rounded-lg border border-dashed border-steelLight py-10 text-center text-sm text-steel">
              No {tab} requests.
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-semibold">Search users</h2>
        <p className="text-sm text-steel">Look up hostellers and day scholars and view their details.</p>
        <input
          className="focus-ring mt-3 w-full rounded-lg border border-steelLight bg-white px-4 py-3 text-sm"
          placeholder="Search by name, email, mobile, role…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => <UserCard key={u.id} user={u} />)
          ) : (
            <p className="text-sm text-steel sm:col-span-2">No users match that search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
