"use client";

import { useMemo, useState } from "react";
import OwnerSettings from "@/components/admin/OwnerSettings";
import UserCard, { type DirectoryUser } from "@/components/admin/UserCard";
import RequestReviewCard, { type AdminRequest } from "@/components/admin/RequestReviewCard";
import { CheckCircle2, Clock3, ClipboardList, Search, SearchX, Shield, Users, XCircle } from "lucide-react";

const roleSearchLabel: Record<string, string> = {
  hosteller: "hostler",
  day_scholar: "day scholar",
  admin: "owner",
};

const tabIcons = {
  pending: Clock3,
  approved: CheckCircle2,
  rejected: XCircle,
} as const;

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
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink text-paper">
          <Shield size={20} strokeWidth={2} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold sm:text-3xl">Owner console</h1>
          <p className="text-sm text-steel">
            Review requests, verify payment, approve to release the mess QR. Requests drop off
            here 48 hours after they're submitted.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <OwnerSettings currentQrUrl={ownerQrUrl} />
      </div>

      <div className="mt-10">
        <div className="flex flex-wrap gap-2">
          {(["pending", "approved", "rejected"] as const).map((t) => {
            const Icon = tabIcons[t];
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`focus-ring flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "bg-chili text-white" : "border border-steelLight bg-white text-ink hover:border-steel/30"
                }`}
              >
                <Icon size={14} />
                {t}
                <span className={`rounded-full px-2 py-0.5 text-xs ${tab === t ? "bg-white/20" : "bg-paper"}`}>
                  {counts[t]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 space-y-3">
          {shownRequests.length > 0 ? (
            shownRequests.map((r, i) => (
              <div key={r.id} className="animate-in" style={{ animationDelay: `${i * 40}ms` }}>
                <RequestReviewCard request={r} />
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-steelLight py-10 text-center">
              <ClipboardList size={22} className="text-steel" strokeWidth={1.5} />
              <p className="text-sm text-steel">No {tab} requests.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Users size={17} className="text-steel" strokeWidth={2} />
          <h2 className="font-display text-lg font-semibold">Search users</h2>
        </div>
        <p className="text-sm text-steel">Look up hostellers and day scholars and view their details.</p>
        <div className="relative mt-3">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-steel/50"
          />
          <input
            className="focus-ring w-full rounded-lg border border-steelLight bg-white py-3 pl-10 pr-4 text-sm"
            placeholder="Search by name, email, mobile, role…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {filteredUsers.length > 0 ? (
            filteredUsers.map((u) => <UserCard key={u.id} user={u} />)
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-steelLight py-10 text-center sm:col-span-2">
              <SearchX size={20} className="text-steel" strokeWidth={1.5} />
              <p className="text-sm text-steel">No users match that search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
