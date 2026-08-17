"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, MailOpen } from "lucide-react";

export type InboxMessage = {
  id: string;
  body: string;
  created_at: string;
  recipient_id: string | null;
  audience: string;
  read_at: string | null;
};

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Inbox({ messages }: { messages: InboxMessage[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [markingId, setMarkingId] = useState<string | null>(null);

  if (messages.length === 0) return null;

  async function markRead(m: InboxMessage) {
    if (m.read_at || !m.recipient_id) return;
    setMarkingId(m.id);
    await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("id", m.id);
    setMarkingId(null);
    router.refresh();
  }

  const unreadCount = messages.filter((m) => m.recipient_id && !m.read_at).length;

  return (
    <div className="stub p-5">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-turmeric/15 text-turmericDark">
          <Mail size={17} strokeWidth={2} />
        </span>
        <div>
          <p className="font-display text-base font-semibold">
            Messages from the owner
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-chili px-2 py-0.5 text-[11px] font-medium text-white">
                {unreadCount} new
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {messages.map((m) => {
          const isUnread = !!m.recipient_id && !m.read_at;
          return (
            <div
              key={m.id}
              onClick={() => markRead(m)}
              className={`rounded-lg border px-4 py-3 transition-colors ${
                isUnread
                  ? "cursor-pointer border-turmeric/30 bg-turmeric/5 hover:bg-turmeric/10"
                  : "border-steelLight bg-white"
              }`}
            >
              <div className="flex items-start gap-2">
                {isUnread ? (
                  <Mail size={14} className="mt-0.5 shrink-0 text-turmericDark" />
                ) : (
                  <MailOpen size={14} className="mt-0.5 shrink-0 text-steel" />
                )}
                <p className="flex-1 text-sm text-ink">{m.body}</p>
              </div>
              <p className="mt-1.5 pl-[22px] text-xs text-steel">
                {m.audience !== "direct" ? "Broadcast · " : ""}
                {timeAgo(m.created_at)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
