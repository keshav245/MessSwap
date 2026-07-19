import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { RECORD_RETENTION_HOURS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Supabase env vars missing" }, { status: 500 });
  }

  // Step 1 — flip anything past its 12-hour "available" window to "expired".
  const expireRes = await fetch(`${url}/rest/v1/rpc/expire_stale_listings`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  let expiredCount = 0;
  if (expireRes.ok) {
    const expiredIds = await expireRes.json();
    expiredCount = Array.isArray(expiredIds) ? expiredIds.length : 0;
  }

  // Step 2 — permanently purge anything past the 48-hour retention window:
  // listings (any status), their QR images, and requests + payment screenshots.
  // Needs the service-role key since this deletes across every user's data.
  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({
      expired: expiredCount,
      purged: null,
      note: "SUPABASE_SERVICE_ROLE_KEY not set — skipped permanent purge. Old records stay hidden from the UI (48h filter) but aren't deleted yet.",
    });
  }

  const cutoff = new Date(Date.now() - RECORD_RETENTION_HOURS * 3_600_000).toISOString();

  const { data: oldListings } = await admin.from("listings").select("id").lt("created_at", cutoff);
  const { data: oldRequests } = await admin.from("requests").select("id").lt("created_at", cutoff);

  const listingIds = (oldListings ?? []).map((l) => l.id);
  const requestIds = (oldRequests ?? []).map((r) => r.id);

  let removedFiles = 0;

  if (listingIds.length > 0) {
    const { data: qrRows } = await admin
      .from("listing_qr")
      .select("image_path")
      .in("listing_id", listingIds);
    const qrPaths = (qrRows ?? []).map((q) => q.image_path);
    if (qrPaths.length > 0) {
      const { data } = await admin.storage.from("qr-codes").remove(qrPaths);
      removedFiles += data?.length ?? 0;
    }
  }

  if (requestIds.length > 0) {
    const { data: screenshotRows } = await admin
      .from("requests")
      .select("payment_screenshot_path")
      .in("id", requestIds);
    const screenshotPaths = (screenshotRows ?? [])
      .map((r) => r.payment_screenshot_path)
      .filter(Boolean) as string[];
    if (screenshotPaths.length > 0) {
      const { data } = await admin.storage.from("payment-screenshots").remove(screenshotPaths);
      removedFiles += data?.length ?? 0;
    }
    await admin.from("requests").delete().in("id", requestIds);
  }

  let removedListings = 0;
  if (listingIds.length > 0) {
    const { error, count } = await admin
      .from("listings")
      .delete({ count: "exact" })
      .in("id", listingIds);
    if (!error) removedListings = count ?? listingIds.length;
  }

  return NextResponse.json({
    expired: expiredCount,
    purged: {
      listings: removedListings,
      requests: requestIds.length,
      files: removedFiles,
    },
  });
}
