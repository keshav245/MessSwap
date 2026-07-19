import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/DashboardNav";
import OwnerConsole from "@/components/admin/OwnerConsole";
import { RECORD_RETENTION_HOURS } from "@/lib/constants";

export default async function AdminDashboard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/auth");
  if (profile.role !== "admin") redirect("/dashboard");

  const retentionCutoff = new Date(Date.now() - RECORD_RETENTION_HOURS * 3600_000).toISOString();

  const [{ data: profiles }, { data: listings }, { data: requests }, { data: ownerQrSetting }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, full_name, email, phone, earnings_total, payout_qr_path, created_at")
        .order("created_at", { ascending: false }),
      supabase.from("listings").select("id, hosteller_id"),
      supabase
        .from("requests")
        .select(
          "id, status, created_at, payment_screenshot_path, listing:listings(id, meal_slot, hosteller_id, hosteller:profiles!listings_hosteller_id_fkey(full_name, phone)), day_scholar:profiles!requests_day_scholar_id_fkey(full_name, phone, email)"
        )
        .gt("created_at", retentionCutoff)
        .order("created_at", { ascending: false }),
      supabase.from("settings").select("value").eq("key", "owner_payment_qr_path").maybeSingle(),
    ]);

  const listingCountByHosteller = new Map<string, number>();
  for (const l of listings ?? []) {
    listingCountByHosteller.set(l.hosteller_id, (listingCountByHosteller.get(l.hosteller_id) ?? 0) + 1);
  }

  const requestCountByDayScholar = new Map<string, number>();
  const { data: requestRows } = await supabase.from("requests").select("day_scholar_id");
  for (const r of requestRows ?? []) {
    requestCountByDayScholar.set(r.day_scholar_id, (requestCountByDayScholar.get(r.day_scholar_id) ?? 0) + 1);
  }

  const users = (profiles ?? []).map((p: any) => ({
    id: p.id,
    role: p.role,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    earnings_total: Number(p.earnings_total ?? 0),
    payout_qr_path: p.payout_qr_path,
    listingsCount: listingCountByHosteller.get(p.id) ?? 0,
    requestsCount: requestCountByDayScholar.get(p.id) ?? 0,
  }));

  const ownerQrUrl = ownerQrSetting?.value
    ? supabase.storage.from("site-assets").getPublicUrl(ownerQrSetting.value).data.publicUrl
    : null;

  return (
    <div>
      <DashboardNav fullName={profile.full_name} roleLabel="Owner" />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <OwnerConsole users={users} requests={(requests ?? []) as any} ownerQrUrl={ownerQrUrl} />
      </main>
    </div>
  );
}
