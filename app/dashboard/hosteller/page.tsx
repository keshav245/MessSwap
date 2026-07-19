import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import PostListingForm from "@/components/hosteller/PostListingForm";
import ListingRow from "@/components/hosteller/ListingRow";
import PayoutQrUpload from "@/components/hosteller/PayoutQrUpload";
import { RECORD_RETENTION_HOURS } from "@/lib/constants";
import { ClipboardList, PackageOpen } from "lucide-react";

export default async function HostellerDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, payout_qr_path, earnings_total")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth");
  if (profile.role === "admin") redirect("/dashboard/admin");
  if (profile.role !== "hosteller") redirect("/dashboard/dayscholar");

  const retentionCutoff = new Date(Date.now() - RECORD_RETENTION_HOURS * 3600_000).toISOString();

  const { data: listings } = await supabase
    .from("listings")
    .select("id, meal_slot, status, created_at, expires_at")
    .eq("hosteller_id", user.id)
    .gt("created_at", retentionCutoff)
    .order("created_at", { ascending: false });

  return (
    <div>
      <DashboardNav fullName={profile.full_name} roleLabel="Hosteller" />
      <main className="mx-auto max-w-4xl space-y-8 px-6 py-10">
        <PayoutQrUpload
          hostellerId={user.id}
          existingPath={profile.payout_qr_path}
          earningsTotal={Number(profile.earnings_total ?? 0)}
        />
        <PostListingForm hostellerId={user.id} />

        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={17} className="text-steel" strokeWidth={2} />
            <h2 className="font-display text-lg font-semibold">Your listings</h2>
          </div>
          <p className="text-xs text-steel">Listings disappear from here 48 hours after you post them.</p>
          <div className="mt-4 space-y-4">
            {(listings ?? []).length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-steelLight py-10 text-center">
                <PackageOpen size={22} className="text-steel" strokeWidth={1.5} />
                <p className="text-sm text-steel">
                  Nothing listed yet — post a spare meal above to get started.
                </p>
              </div>
            )}
            {(listings ?? []).map((listing) => (
              <ListingRow key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
