import { UserTier } from "./billing";

export type Feature =
  | "generate-scope"
  | "audio-transcription"
  | "analyze-repo"
  | "patch-scope"
  | "deploy-schema"
  | "generate-sla"
  | "pdf-export"
  | "mermaid-flows"
  | "team-seats"
  | "api-webhooks";

// Feature tier mapping
const FEATURE_TIER_MAP: Record<Feature, UserTier> = {
  "generate-scope": "free",
  "audio-transcription": "pro",
  "analyze-repo": "pro",
  "patch-scope": "pro",
  "deploy-schema": "pro",
  "generate-sla": "pro",
  "pdf-export": "pro",
  "mermaid-flows": "pro",
  "team-seats": "pro",
  "api-webhooks": "pro",
};

export function canAccessFeature(tier: UserTier, feature: Feature): boolean {
  const requiredTier = FEATURE_TIER_MAP[feature];
  if (!requiredTier) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  if (tier === "pro") return true;
  if (tier === "free") return requiredTier === "free";
  return false;
}

export function getFeatureRequiredTier(feature: Feature): UserTier {
  return FEATURE_TIER_MAP[feature];
}

export function getBlockedFeatures(tier: UserTier): Feature[] {
  return (Object.entries(FEATURE_TIER_MAP) as [Feature, UserTier][])
    .filter(([, requiredTier]) => requiredTier !== tier && tier === "free")
    .map(([feature]) => feature);
}

export function getUpsellMessage(feature: Feature): string {
  const messages: Record<Feature, string> = {
    "generate-scope": "This feature is included in all plans",
    "audio-transcription":
      "Audio transcription is available in Pro. Upgrade to use your client call recordings.",
    "analyze-repo":
      "Repository analysis is a Pro feature. Upgrade to analyze GitHub repos on-demand.",
    "patch-scope":
      "Scope refinement is available in Pro. Upgrade to iterate on your architecture.",
    "deploy-schema":
      "One-click schema deployment is a Pro feature. Upgrade to deploy to Supabase instantly.",
    "generate-sla":
      "SLA generation is available in Pro. Upgrade to create legal documents from your scope.",
    "pdf-export":
      "White-labeled PDF exports are a Pro feature. Upgrade to share branded deliverables.",
    "mermaid-flows":
      "Mermaid.js architecture flows are available in Pro. Upgrade for visual exports.",
    "team-seats": "Team seats are included in the Agency plan. Contact sales for bulk licensing.",
    "api-webhooks": "API webhooks are available in Pro. Upgrade to integrate with your systems.",
  };
  return messages[feature] || "This feature requires a Pro subscription";
}
