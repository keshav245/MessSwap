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

  // 1. Flip anything past its 12h window from "available" to "expired".
  const expireRes = await fetch(`${url}/rest/v1/rpc/expire_stale_listings`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: "{}",
  });

  const expiredIds = expireRes.ok ? await expireRes.json() : [];

  // 2. Permanently purge anything past the 48h retention window — rows and
  // the actual storage files. Requires the service role key; skipped
  // (with rows still hidden from the UI by query filters) if not configured.
  const admin = createAdminClient();
  let purged = { listings: 0, requests: 0, messages: 0, files: 0 };

  if (admin) {
    const cutoff = new Date(Date.now() - RECORD_RETENTION_HOURS * 3600_000).toISOString();

    const { data: oldListings } = await admin
      .from("listings")
      .select("id")
      .lt("created_at", cutoff);
    const oldListingIds = (oldListings ?? []).map((l) => l.id);

    const { data: oldRequests } = await admin
      .from("requests")
      .select("id, payment_screenshot_path")
      .lt("created_at", cutoff);

    if (oldListingIds.length > 0) {
      const { data: qrRows } = await admin
        .from("listing_qr")
        .select("image_path")
        .in("listing_id", oldListingIds);
      const qrPaths = (qrRows ?? []).map((q) => q.image_path).filter(Boolean);
      if (qrPaths.length > 0) {
        await admin.storage.from("qr-codes").remove(qrPaths);
        purged.files += qrPaths.length;
      }
    }

    const screenshotPaths = (oldRequests ?? [])
      .map((r) => r.payment_screenshot_path)
      .filter(Boolean) as string[];
    if (screenshotPaths.length > 0) {
      await admin.storage.from("payment-screenshots").remove(screenshotPaths);
      purged.files += screenshotPaths.length;
    }

    if ((oldRequests ?? []).length > 0) {
      const { count } = await admin
        .from("requests")
        .delete({ count: "exact" })
        .lt("created_at", cutoff);
      purged.requests = count ?? 0;
    }

    if (oldListingIds.length > 0) {
      const { count } = await admin
        .from("listings")
        .delete({ count: "exact" })
        .lt("created_at", cutoff);
      purged.listings = count ?? 0;
    }

    const { count: messageCount } = await admin
      .from("messages")
      .delete({ count: "exact" })
      .lt("created_at", cutoff);
    purged.messages = messageCount ?? 0;
  }

  return NextResponse.json({
    expired: Array.isArray(expiredIds) ? expiredIds.length : 0,
    purged,
    serviceRoleConfigured: !!admin,
  });
}
