import { UserTier } from "./billing";

export type Feature =
  | "generate-scope"       // Free+: basic scope generation (3/month for free)
  | "audio-transcription"  // Pro+: transcribe client call recordings
  | "analyze-repo"         // Pro+: GitHub repo analysis
  | "patch-scope"          // Pro+: AI chat to refine scope
  | "deploy-schema"        // Pro+: 1-click Supabase schema deploy
  | "generate-sla"         // Pro+: SLA document generation
  | "pdf-export"           // Pro+: white-labeled branded PDF
  | "mermaid-flows"        // Pro+: Mermaid.js architecture diagram
  | "team-seats"           // Agency only: up to 5 team seats
  | "tech-stack-lock"      // Agency only: lock to custom tech stacks (MERN, etc.)
  | "shared-workspace"     // Agency only: shared lead tracking workspace
  | "priority-support"     // Agency only: dedicated priority channel
  | "api-webhooks";        // Agency only: outbound webhook access

/**
 * Minimum tier required to access each feature.
 * "free"   → everyone can use it
 * "pro"    → requires Pro (Solo Architect) or Agency
 * "agency" → requires Agency Blueprint only
 */
const FEATURE_TIER_MAP: Record<Feature, UserTier> = {
  "generate-scope":      "free",
  "audio-transcription": "pro",
  "analyze-repo":        "pro",
  "patch-scope":         "pro",
  "deploy-schema":       "pro",
  "generate-sla":        "pro",
  "pdf-export":          "pro",
  "mermaid-flows":       "pro",
  "team-seats":          "agency",
  "tech-stack-lock":     "agency",
  "shared-workspace":    "agency",
  "priority-support":    "agency",
  "api-webhooks":        "agency",
};

/** Tier ordering for comparison */
const TIER_RANK: Record<UserTier, number> = {
  free:   0,
  pro:    1,
  agency: 2,
};

/**
 * Returns true if the user's tier meets or exceeds the minimum tier
 * required for the given feature.
 */
export function canAccessFeature(tier: UserTier, feature: Feature): boolean {
  const requiredTier = FEATURE_TIER_MAP[feature];
  if (!requiredTier) {
    console.warn(`Unknown feature: ${feature}`);
    return false;
  }
  return TIER_RANK[tier] >= TIER_RANK[requiredTier];
}

export function getFeatureRequiredTier(feature: Feature): UserTier {
  return FEATURE_TIER_MAP[feature];
}

export function getBlockedFeatures(tier: UserTier): Feature[] {
  return (Object.entries(FEATURE_TIER_MAP) as [Feature, UserTier][])
    .filter(([, requiredTier]) => TIER_RANK[tier] < TIER_RANK[requiredTier])
    .map(([feature]) => feature);
}

export function getUpsellMessage(feature: Feature, currentTier: UserTier = "free"): string {
  const requiredTier = FEATURE_TIER_MAP[feature];

  const upgradeTarget =
    requiredTier === "agency" ? "Agency Blueprint" : "Solo Architect (Pro)";

  const messages: Record<Feature, string> = {
    "generate-scope":
      "This feature is included in all plans.",
    "audio-transcription":
      "Audio transcription is a Pro feature. Upgrade to use your client call recordings.",
    "analyze-repo":
      "Repository analysis is a Pro feature. Upgrade to analyse GitHub repos on-demand.",
    "patch-scope":
      "Scope refinement is a Pro feature. Upgrade to iterate on your architecture with AI.",
    "deploy-schema":
      "1-Click Supabase deployment is a Pro feature. Upgrade to deploy schemas instantly.",
    "generate-sla":
      "SLA generation is a Pro feature. Upgrade to create legal documents from your scope.",
    "pdf-export":
      "White-labeled PDF exports are a Pro feature. Upgrade to share branded deliverables.",
    "mermaid-flows":
      "Mermaid.js architecture diagrams are a Pro feature. Upgrade for visual exports.",
    "team-seats":
      "Team seats are an Agency feature. Upgrade to Agency Blueprint to add up to 5 members.",
    "tech-stack-lock":
      "Custom tech-stack enforcement is an Agency feature. Upgrade to lock projects to MERN, LAMP, etc.",
    "shared-workspace":
      "The shared lead-tracking workspace is an Agency feature. Upgrade to collaborate with your team.",
    "priority-support":
      "Priority dedicated support is an Agency feature. Upgrade for a direct support channel.",
    "api-webhooks":
      "API webhook access is an Agency feature. Upgrade to integrate StackScope with your systems.",
  };

  const base = messages[feature] || `This feature requires the ${upgradeTarget} plan.`;
  if (currentTier === "free" && requiredTier === "agency") {
    return `${base} You are currently on the Free plan.`;
  }
  return base;
}
