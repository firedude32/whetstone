import { loadPolicies } from "@/lib/policies/loader";
import Chat, { type PolicySummary } from "@/components/Chat";

export default function Home() {
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
  return <Chat policies={policies} />;
}
