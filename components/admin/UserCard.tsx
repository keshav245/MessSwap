"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { signedUrl } from "@/lib/storage";

export type DirectoryUser = {
  id: string;
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  earnings_total: number;
  payout_qr_path: string | null;
  listingsCount: number;
  requestsCount: number;
};

function RoleBadge({ role }: { role: string }) {
  if (role === "hosteller") {
    return <span className="rounded-full bg-chili px-3 py-1 text-xs font-medium text-white">Hostler</span>;
  }
  if (role === "admin") {
    return <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-white">Owner</span>;
  }
  return (
    <span className="rounded-full border border-steelLight bg-paper px-3 py-1 text-xs font-medium text-ink">
      Day Scholar
    </span>
  );
}

export default function UserCard({ user }: { user: DirectoryUser }) {
  const supabase = createClient();
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user.role === "hosteller" && user.payout_qr_path) {
      signedUrl(supabase, "payout-qr", user.payout_qr_path).then(setQrPreview);
    }
  }, [user.payout_qr_path, user.role]);

  return (
    <div className="stub p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-steelLight bg-paper font-display text-sm font-semibold text-steel">
            {user.full_name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-ink">{user.full_name}</p>
            {user.email && <p className="text-xs text-steel">{user.email}</p>}
          </div>
        </div>
        <RoleBadge role={user.role} />
      </div>

      <div className="mt-3 space-y-1 text-xs text-steel">
        {user.phone && <p>{user.phone}</p>}
        {user.role === "hosteller" && (
          <p>
            {user.listingsCount} listings · ₹{user.earnings_total} earned
          </p>
        )}
        {user.role === "day_scholar" && <p>{user.requestsCount} requests</p>}
      </div>

      {user.role === "hosteller" && (
        <div className="mt-3">
          {qrPreview ? (
            <img src={qrPreview} alt={`${user.full_name}'s payout QR`} className="h-20 w-20 rounded-lg border border-steelLight object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-dashed border-steelLight text-center text-[10px] text-steel">
              No payout QR
            </div>
          )}
        </div>
      )}
    </div>
  );
}
