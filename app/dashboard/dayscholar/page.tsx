import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import BrowseListings from "@/components/dayscholar/BrowseListings";
import MyQrCodes from "@/components/dayscholar/MyQrCodes";
import RequestHistory from "@/components/dayscholar/RequestHistory";
import { UtensilsCrossed } from "lucide-react";

export default async function DayScholarDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth");
  if (profile.role === "admin") redirect("/dashboard/admin");
  if (profile.role !== "day_scholar") redirect("/dashboard/hosteller");

  const [{ data: listings }, { data: ownerQrSetting }, { data: myRequests }] = await Promise.all([
    supabase
      .from("listings")
      .select("id, meal_slot, expires_at")
      .eq("status", "available")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true }),
    supabase.from("settings").select("value").eq("key", "owner_payment_qr_path").maybeSingle(),
    supabase
      .from("requests")
      .select("id, status, created_at, listing:listings(id, meal_slot)")
      .eq("day_scholar_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const ownerQrUrl = ownerQrSetting?.value
    ? supabase.storage.from("site-assets").getPublicUrl(ownerQrSetting.value).data.publicUrl
    : null;

  const approvedRequests = (myRequests ?? []).filter((r: any) => r.status === "approved" && r.listing);

  let qrItems: { requestId: string; mealSlot: string; qrUrl: string }[] = [];
  if (approvedRequests.length > 0) {
    const listingIds = approvedRequests.map((r: any) => r.listing.id);
    const { data: qrRows } = await supabase
      .from("listing_qr")
      .select("listing_id, image_path")
      .in("listing_id", listingIds);

    const qrByListing = new Map((qrRows ?? []).map((q: any) => [q.listing_id, q.image_path]));
    qrItems = approvedRequests
      .map((r: any) => {
        const path = qrByListing.get(r.listing.id);
        if (!path) return null;
        return {
          requestId: r.id,
          mealSlot: r.listing.meal_slot,
          qrUrl: supabase.storage.from("qr-codes").getPublicUrl(path).data.publicUrl,
        };
      })
      .filter(Boolean) as { requestId: string; mealSlot: string; qrUrl: string }[];
  }

  const requestHistory = (myRequests ?? [])
    .filter((r: any) => r.listing)
    .map((r: any) => ({
      id: r.id,
      status: r.status,
      created_at: r.created_at,
      meal_slot: r.listing.meal_slot,
    }));

  return (
    <div>
      <DashboardNav fullName={profile.full_name} roleLabel="Day Scholar" />
      <main className="mx-auto max-w-4xl space-y-10 px-6 py-10">
        <MyQrCodes items={qrItems} />

        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <UtensilsCrossed size={17} className="text-steel" strokeWidth={2} />
            Browse meals
          </h2>
          <div className="mt-4">
            <BrowseListings
              listings={(listings ?? []) as any}
              ownerQrUrl={ownerQrUrl}
              dayScholarId={user.id}
            />
          </div>
        </div>

        <RequestHistory requests={requestHistory} />
      </main>
    </div>
  );
}
