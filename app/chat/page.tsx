import type { Metadata } from "next";
import { loadPolicies } from "@/lib/policies/loader";
import Chat, { type PolicySummary } from "@/components/Chat";

export const metadata: Metadata = { title: "Chat · Whetstone" };

export default async function ChatPage({ searchParams }: PageProps<"/chat">) {
  // The homepage's ask box links here with ?draft=..., which prefills (never sends) the message.
  const { draft } = await searchParams;

  // Runs on the server: reads policies/*.md and passes only what the UI needs.
  const policies: PolicySummary[] = loadPolicies().map((p) => ({
    id: p.id,
    name: p.name,
    summary: p.summary,
    defaultOn: p.default === "on",
    enforcement: p.enforcement,
    dailyLimit: typeof p.config.daily_limit === "number" ? p.config.daily_limit : undefined,
    minWords: typeof p.config.min_words === "number" ? p.config.min_words : undefined,
  }));
  return <Chat policies={policies} initialDraft={typeof draft === "string" ? draft : ""} />;
}
