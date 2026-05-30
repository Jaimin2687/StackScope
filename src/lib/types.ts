export interface ScopeProposal {
  title: string;
  summary: string;
  objectives: string[];
}

export interface SprintItem {
  sprint: number;
  duration: string;
  tasks: string[];
}

export interface TechStack {
  frontend: string[];
  backend: string[];
  database: string;
  infra: string[];
  detailed_specifications?: string;
}

export interface UnitEconomics {
  hosting_costs_per_month?: string;
  database_costs_per_month?: string;
  expected_profit_margin?: string;
  break_even_users?: number;
}

export interface OptionalFeature {
  id: string;
  name: string;
  description: string;
  cost_add_inr: number;
  weeks_add: number;
  selected_by_default: boolean;
}

export interface Estimates {
  total_weeks?: number;
  dev_days?: number;
  team_size?: number;
  cost_estimate_inr?: string;
  base_cost_inr?: number;
  base_weeks?: number;
  optional_features?: OptionalFeature[];
}

export interface GeneratedScope {
  providerUsed?: "groq" | "gemini" | "deterministic";
  proposal: ScopeProposal;
  sprint_timeline: SprintItem[];
  tech_stack: TechStack;
  sql_schema: string;
  detailed_architecture?: string;
  scalability_plan?: string[];
  unit_economics?: UnitEconomics;
  mermaid_diagram?: string;
  estimates?: Estimates;
  is_deleted?: boolean;
  deleted_at?: string;
  // Dynamic fields fallback
  [key: string]: any;
}

export type ScopeJobStatus = "queued" | "processing" | "succeeded" | "failed";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
}

export interface Project {
  id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScopeComment {
  id: string;
  scope_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ClientScope {
  id: string;
  user_id: string;
  project_id?: string | null;
  status?: 'draft' | 'under_review' | 'approved' | 'rejected';
  raw_brief: string;
  target_language: string;
  generated_proposal: GeneratedScope | null;
  generated_sql: string | null;
  created_at: string;
  updated_at?: string;
  is_deleted?: boolean;
  deleted_at?: string;
}

export interface UserLegalConsent {
  id: string;
  user_id: string;
  consent_version: string;
  ip_address: string | null;
  accepted_at: string;
}

export interface LegalConsentResponse {
  success: boolean;
  consent?: UserLegalConsent;
  error?: string;
}

export const SUPPORTED_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "hi", label: "Hindi" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "pt", label: "Portuguese" },
  { value: "ar", label: "Arabic" },
  { value: "ko", label: "Korean" },
] as const;
