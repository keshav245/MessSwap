import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  const apiKey = process.env.RESEND_API_KEY;
  const ownerEmail = process.env.OWNER_EMAIL;

  // Not configured — silently no-op so the request flow never breaks over this.
  if (!apiKey || !ownerEmail) {
    return NextResponse.json({ sent: false, reason: "not_configured" });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL ?? "MessSwap <onboarding@resend.dev>",
        to: ownerEmail,
        subject: "New MessSwap request pending",
        text: "A day scholar just submitted a payment for review. Open the owner console to approve or reject it.",
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ sent: false, reason: await res.text() }, { status: 200 });
    }

    return NextResponse.json({ sent: true });
  } catch {
    return NextResponse.json({ sent: false, reason: "network_error" });
  }
}
