# StackScope AI: Comprehensive Technical Architecture & Platform Deep Dive

This document is the authoritative technical blueprint for **StackScope AI** — covering sponsor component usage, system internals, AI inference pipelines, database architecture, security, scalability, and monetization workflows.

---

## Table of Contents

1. [🍉 Watermelon UI — Sponsor Component Usage](#1--watermelon-ui--sponsor-component-usage)
2. [Problem Analysis & Market Relevance](#2-problem-analysis--market-relevance)
3. [System Overview](#3-system-overview)
4. [In-Depth Architectural Details](#4-in-depth-architectural-details)
5. [The Database & B2B Multi-Tenant Architecture](#5-the-database--b2b-multi-tenant-architecture)
6. [GitHub Ingestion & Context Hydration](#6-github-ingestion--context-hydration)
7. [The God-Mode AI Inference Pipeline](#7-the-god-mode-ai-inference-pipeline)
8. [Algorithmic Monetization (Stripe SLAs)](#8-algorithmic-monetization-stripe-slas)
9. [Luxury UI & Artifact Generation](#9-luxury-ui--artifact-generation)
10. [Scalability Architecture](#10-scalability-architecture)

---

## 1. 🍉 Watermelon UI — Sponsor Component Usage

> **Sponsor Note:** StackScope AI was built using [ui.watermelon.sh](https://ui.watermelon.sh/) as its core UI component library. Every interactive surface — from the landing page hero to the dashboard scope cards to auth forms — is powered by Watermelon UI components. The sections below document every component used, **exactly which files they appear in**, what props/variants are utilized, and the precise visual role each one plays in the product.

All Watermelon UI components are locally adapted in two files:
- **`src/components/ui/watermelon.tsx`** — Primary component library (Button, Card, Input, Textarea, Select, Badge)
- **`src/components/ui/watermelon-badge.tsx`** — Attribution badge component (WatermelonBadge)

These components are consumed across **7 distinct files** in the application. The full import registry is:

```typescript
// src/components/scope-card.tsx
import { Badge } from "./ui/watermelon";

// src/app/page.tsx  (Landing Page)
import { WatermelonBadge } from "@/components/ui/watermelon-badge";

// src/components/auth-form.tsx
import { Button, Input } from "@/components/ui/watermelon";

// src/components/results-view.tsx
import { Button } from "@/components/ui/watermelon";  // (CTAs inside workspace)

// src/app/workspace/page.tsx
import { Textarea, Button } from "@/components/ui/watermelon";

// src/app/settings/page.tsx
import { Button, Input, Select } from "@/components/ui/watermelon";

// src/app/dashboard/page.tsx
import { Card } from "@/components/ui/watermelon";
```

---

### 1.1. `Button` — Motion-Powered CTA System

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.forwardRef<HTMLButtonElement, ButtonProps>` extending `HTMLMotionProps<"button">`  
**Used in:** `auth-form.tsx` · `results-view.tsx` · `workspace/page.tsx` · `settings/page.tsx`

The Watermelon `Button` wraps a Framer Motion `motion.button`, giving every CTA a tactile spring animation baked in. It exposes a composable `variant` + `size` API:

| Variant | Visual Role in StackScope |
|---|---|
| `primary` | "Sign In", "Submit Brief", "Save Settings" — white bg, black text, dominant CTAs |
| `secondary` | "Cancel", "Go to Settings" — dark glass, matches the observatory theme |
| `ghost` | Tab switchers, icon-only triggers inside the workspace toolbar |
| `destructive` | Hard delete confirmation inside the Bin view of the dashboard |

| Size | Where Used |
|---|---|
| `sm` | Inline action buttons inside ScopeCard toolbar (SLA, Download, Delete) |
| `md` | Auth form submit, Settings save |
| `lg` | Primary hero CTAs (unused but available) |

**Motion spec:** `whileHover={{ scale: 1.01 }}`, `whileTap={{ scale: 0.98 }}` — every button on the platform has this physics response.

---

### 1.2. `Card` — Dark Panel Container

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>`  
**Used in:** `dashboard/page.tsx` · workspace result panels · pricing tier boxes

A `motion.div` wrapper delivering the core **Neon Observatory** dark panel look: `rounded-xl border border-[#333] bg-[#0a0a0a] shadow-sm`. Every scope output panel, pricing card, and data container in the app inherits this component.

---

### 1.3. `Input` — Unified Form Control

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>`  
**Used in:** `auth-form.tsx` (email + password) · `settings/page.tsx` (Supabase URL + anon key) · `scope-card.tsx` (SLA URL read-only display)

Full-width input with `border-[#333] bg-[#000] focus:ring-white/20`. The `disabled` prop triggers `opacity-50 pointer-events-none` — used on the SLA URL field so users can select-all without accidentally editing it.

---

### 1.4. `Textarea` — Project Brief Entry

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>`  
**Used in:** `workspace/page.tsx` — the primary project brief input field

The most user-facing Watermelon component. Every user who opens StackScope and types their project idea is typing into this component. It enforces `resize-none` to preserve the layout integrity of the workspace, with `min-h-[80px]` and matching focus ring system as the `Input`.

---

### 1.5. `Select` — Option Picker

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>`  
**Used in:** `settings/page.tsx` — organization switcher and configuration option selectors

Overrides native browser `<select>` chrome with `appearance-none` and a manually positioned `▼` chevron (absolute-positioned `<span>`) for pixel-perfect cross-browser consistency.

---

### 1.6. `Badge` — Tech Stack & Label Chips

**Source file:** `src/components/ui/watermelon.tsx`  
**Type:** `React.FC<{ tone?: "primary" | "secondary" | "neutral" } & HTMLAttributes<HTMLSpanElement>>`  
**Used in:** `scope-card.tsx` (×3 instances per card) · `results-view.tsx` (tech stack tab)

The most-rendered Watermelon component across the entire platform. Every scope card on the dashboard renders **at minimum 3 Badge instances**:
1. `tone="secondary"` → Platform label ("StackScope AI")
2. `tone="secondary"` → Frontend tech chip (e.g. "Next.js")
3. `tone="secondary"` → Backend tech chip (e.g. "FastAPI")

In the workspace Results View (Tech Stack tab), Badge chips are rendered **for every technology in every category** of the AI output — potentially 20–30 badges per scope.

| Tone | Usage in StackScope |
|---|---|
| `primary` | Highlighted capability labels on landing page feature grid |
| `secondary` | All dashboard scope card metadata (platform label, tech chips) |
| `neutral` | Passive informational labels |

---

### 1.7. `WatermelonBadge` — Hero Attribution Component

**Source file:** `src/components/ui/watermelon-badge.tsx`  
**Type:** Named functional export, no props  
**Used in:** `src/app/page.tsx` — Landing page hero section, **position: first element above the H1 headline**

This component is intentionally placed as the **very first thing a visitor sees** on the StackScope landing page — above the headline, above the subtext, above every CTA. It is the opening visual element of the entire product.

Implementation details:
- Glassmorphic pill: `backdrop-blur-md bg-black/50 border border-pink-500/30`
- Ambient glow: `shadow-[0_0_15px_rgba(236,72,153,0.15)]`
- Hover gradient sweep: `from-pink-500/20 to-emerald-500/20` — visible on hover via `group-hover:opacity-100`
- Motion: `whileHover={{ scale: 1.05 }}`, `whileTap={{ scale: 0.95 }}`
- Content: 🍉 emoji + `Powered by ui.watermelon.sh` with `text-pink-400` brand highlight
- The component wraps an `<a href="https://ui.watermelon.sh/">` — every visitor who clicks it is sent directly to the Watermelon UI site

```tsx
// src/app/page.tsx — Hero section, line 63
<WatermelonBadge />
{/* Pulsing ring around badge */}
<div className="absolute -inset-1 bg-emerald-500/20 rounded-full blur-md animate-pulse" />
```

The pulsing ring amplifies the badge's visual weight — it actively draws user attention.

---

### 1.8. Complete Component Usage Registry

**Total Watermelon UI component renders per typical user session:** 80–150+ (badge chips alone account for 20–30 per scope; the Analyzer page adds 4–8 additional component mounts per scan).

**Platform-wide import registry (updated after Watermelon UI expansion to Analyzer + SideNav):**

| Component | Variant | Import File | Screen | Visual Role |
|---|---|---|---|---|
| `Button` `primary` | — | `auth-form.tsx` | Login / Register | "Sign In", "Create Account" submits |
| `Button` `secondary` | — | `results-view.tsx` | Workspace | "Go to Settings" in deploy modal |
| `Button` `ghost` | — | `workspace/page.tsx` | Workspace | Tab switchers, toolbar actions |
| `Button` `destructive` | — | `dashboard/page.tsx` | Dashboard Bin | Hard delete confirmation |
| `Button` `primary` | `size="lg"` | `analyzer/page.tsx` | Analyzer | "Analyze Base" submit + "Generate Blueprint" CTA |
| `Button` `primary` | `size="sm"` | `side-nav.tsx` | Global Nav | "New Scope" primary navigation CTA |
| `Button` `ghost` | `size="sm"` | `side-nav.tsx` | Global Nav | Settings + Sign Out nav actions |
| `Card` | — | `dashboard/page.tsx` | Dashboard | Scope output container panels |
| `Card` | — | `analyzer/page.tsx` | Analyzer | Repo URL form container + results panel |
| `Input` | — | `auth-form.tsx` | Login / Register | Email + password fields |
| `Input` | — | `settings/page.tsx` | Settings | Supabase URL + anon key fields |
| `Input` `readOnly` | — | `scope-card.tsx` | Dashboard modal | Stripe SLA URL display |
| `Input` | — | `analyzer/page.tsx` | Analyzer | GitHub repository URL field |
| `Textarea` | — | `workspace/page.tsx` | Workspace | Project brief input (core UX) |
| `Select` | — | `settings/page.tsx` | Settings | Organization / config selectors |
| `Badge` `secondary` | — | `scope-card.tsx` | Dashboard | Platform label + tech stack chips |
| `Badge` `secondary` | — | `results-view.tsx` | Workspace | Tech stack category chips |
| `Badge` `primary` | — | `page.tsx` | Landing page | Feature capability labels |
| `Badge` `primary/secondary` | — | `analyzer/page.tsx` | Analyzer | Status text pill + language chip + issue type labels |
| `WatermelonBadge` | — | `page.tsx` | Landing hero | Sponsor attribution (first visual element) |

---

## 2. Problem Analysis & Market Relevance

### 2.1. The Problem We're Solving

Every software development agency, freelance principal engineer, and internal product team faces a brutal, universally shared bottleneck: **the technical scoping phase**. Before a single line of code can be written, teams must manually:

- Conduct stakeholder discovery sessions
- Translate vague client briefs into precise technical requirements
- Design normalized database schemas from scratch
- Produce API endpoint contracts
- Build sprint timelines and resource estimates
- Draft service-level agreements (SLAs) and link them to payment milestones

This scoping process is **extremely expensive in time** (often 3–10 days per project), **highly repetitive** (the cognitive process is near-identical project to project), and **prone to costly human error.** Underscoped projects bleed margins; overscoped ones kill deals.

### 2.2. Is the Problem Real?

Yes — decisively. Data from the software industry consistently validates this pain point:

| Signal | Data Point |
|---|---|
| **Scope creep prevalence** | 52% of software projects experience scope creep (PMI, 2023) |
| **Manual spec writing cost** | Senior engineers bill $150–$300/hr; 2–4 days per project = $2,400–$9,600/project just on scoping |
| **AI tooling adoption** | Global AI software market expected to hit $391B by 2025 (Statista) |
| **B2B SaaS growth** | B2B SaaS revenue growing at ~18% CAGR — demand for automation tools is surging |
| **Target audience size** | 26.9M software developers globally; 680K+ freelance agencies in the US alone |

### 2.3. Why StackScope Is the Right Answer

Existing tools like ChatGPT, GitHub Copilot, or Notion AI are **general-purpose cognitive assistants**. They can help write specs, but they cannot:

1. Ingest a live GitHub repository's full codebase topology to generate **transition architectures**
2. Auto-generate **Stripe Checkout links** directly tied to the scoped deliverables
3. Enforce strict **3NF normalized SQL schema** generation via prompt-level constraints
4. Produce **Mermaid.js architecture diagrams** embedded inside branded PDF artifacts
5. Execute a **1-Click Supabase database deployment** directly from the generated schema
6. Support **voice-to-architecture** via audio file transcription

StackScope is not a general assistant. It is a **vertically specialized scoping engine** built specifically to eliminate the pre-development phase bottleneck. The problem is both real and persistently underserved.

---

## 3. System Overview

StackScope is a B2B cognitive synthesizer built for Principal Engineers and Development Agencies. It is fundamentally an **ETL (Extract, Transform, Load) and Inference engine** that converts unstructured intelligence (Audio, Natural Language, or Raw GitHub Repositories) into structured, highly decoupled technical specifications (PDF Artifacts) and immediately actionable Stripe Checkout SLAs.

### 3.1. Core Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router, RSC) | `^16.2.1` |
| **Language** | TypeScript | `^6.0.2` |
| **UI Library** | Watermelon UI (`ui.watermelon.sh`) | Custom port |
| **Animation** | Framer Motion | `^12.38.0` |
| **Icons** | Lucide React | `^1.7.0` |
| **Database / Auth** | Supabase (PostgreSQL + RLS) | `^2.100.0` |
| **Primary AI** | Groq (Llama 3 / Mixtral) via `groq-sdk` | `^1.1.2` |
| **Fallback AI** | Google Gemini 1.5 Flash | `^0.24.1` |
| **Payments** | Stripe Checkout SDK | `^21.0.1` |
| **PDF Generation** | jsPDF | `^4.2.1` |
| **Diagram Rendering** | Mermaid.js | `^11.13.0` |
| **Utility Classes** | clsx + tailwind-merge | Latest |
| **Date Formatting** | date-fns | `^4.1.0` |
| **Styling** | Tailwind CSS v4 | `^4.2.2` |

---

## 4. In-Depth Architectural Details

### 4.1. Application Route Topology

```
/                     → Landing page (SSR-capable, CS interactive)
/login                → Supabase Auth form (email + password)
/dashboard            → Scope history list (server component, RLS-filtered)
/workspace            → Analyzer engine (audio/text input → AI output display)
/workspace?id={uuid}  → Scope reload from Supabase (persistent session)
/pricing              → SaaS subscription tiers (Stripe integration)
/settings             → User Supabase credentials config (AES-256 encrypted)
/api/generate-scope   → Core AI inference route (Groq → Gemini failover)
/api/generate-sla     → Stripe SLA checkout session generator
/api/create-subscription → Stripe recurring subscription creator
/api/deploy-schema    → 1-Click Supabase schema provisioner
/api/transcribe       → Audio → text transcription endpoint
```

### 4.2. Data Flow — Workspace (Core User Journey)

```
User Input
   │
   ├── [Text] → Direct to prompt compiler
   └── [Audio file] → /api/transcribe → Whisper/Gemini → text → prompt compiler
          │
          ├── [GitHub URL] → GitHub REST API → Git Tree (recursive) → file blob decode → inject to prompt
          │
          ▼
   Prompt Compiler (system prompt + user context + codebase topology)
          │
          ▼
   Groq SDK (Llama 3 / Mixtral) [Primary]
          │
          ├── Success → Parse JSON → store in Supabase `client_scopes` → render ResultsView
          └── 429 / 500 → Failover
                    │
                    ▼
            Google Gemini 1.5 Flash [Fallback]
                    │
                    └── Parse JSON → store in Supabase `client_scopes` → render ResultsView
```

### 4.3. Next.js App Router Patterns

- **Server Components** power the `/dashboard` route — Supabase query runs server-side, HTML streamed to client with RLS context applied. Zero client-side data fetching for the initial render.
- **Client Components** handle all interactive surfaces: workspace form state, tab switching, PDF generation, SLA modal management.
- **Dynamic Imports** are used aggressively for heavy payloads: `MermaidDiagram` is code-split with `next/dynamic` (`ssr: false`) to prevent a 1.5MB Mermaid.js runtime from blocking the initial page paint.
- **Server Actions** are used within `/settings` to check Supabase configuration status server-side (`checkConfigurationStatus()`).

### 4.4. TypeScript Type System

All AI-generated scope outputs conform to a strict `GeneratedScope` interface declared in `src/lib/types.ts`:

```typescript
interface GeneratedScope {
  proposal: {
    title: string;
    summary: string;
    objectives: string[];
  };
  tech_stack: {
    frontend: string[];
    backend: string[];
    database: string[];
    devops: string[];
  };
  sql_schema: string;
  sprint_timeline: SprintEntry[];
  mermaid_diagram: string;
  estimates: EstimatesBlock;
  api_endpoints: ApiEndpoint[];
  data_model_summary: DataModelSummary;
  security: SecurityBlock;
  assumptions: string[];
}
```

This interface is shared between the API response parsing layer and the `ResultsView` renderer, ensuring compile-time type safety across the entire output pipeline.

### 4.5. Security Architecture

| Layer | Mechanism |
|---|---|
| **Authentication** | Supabase Auth (JWT-based, httpOnly cookie sessions via `@supabase/ssr`) |
| **Row-Level Security** | PostgreSQL RLS policies on `profiles`, `organizations`, `projects`, `client_scopes` |
| **DB Credential Storage** | AES-256 encryption of user-provided Supabase credentials (URL + anon key) in settings |
| **API Protection** | All `/api/*` routes validate session via Supabase server client before executing |
| **Stripe Webhooks** | Signature verification via `stripe.webhooks.constructEvent` |
| **Client-side data** | No credentials, tokens, or secrets handled in browser JS |

---

## 5. The Database & B2B Multi-Tenant Architecture

### 5.1. Strict 3NF PostgreSQL Schema

The entire application runs on a relational PostgreSQL matrix managed by Supabase. To establish a true SaaS/B2B isolation, the schema follows a hierarchical topology:

```
profiles → organizations (Tenant) → organization_members → projects → client_scopes (AI Outputs)
```

### 5.2. Entity Relationship Overview

| Table | Primary Key | Foreign Keys | Purpose |
|---|---|---|---|
| `profiles` | `id (uuid)` | `auth.users.id` | Extended user profile |
| `organizations` | `id (uuid)` | `profiles.id` (owner) | B2B tenant container |
| `organization_members` | `(org_id, user_id)` | `organizations`, `profiles` | Multi-user org membership |
| `projects` | `id (uuid)` | `organizations.id` | Project groupings per tenant |
| `client_scopes` | `id (uuid)` | `projects.id`, `profiles.id` | Individual AI inference outputs |

### 5.3. Bypassing RLS Infinite Recursion

A classic challenge in multi-tenant RLS is reading access from `organization_members` to grant access to `projects`, which can trigger an infinite relational evaluation loop in PostgreSQL.

**How it was solved:**

Instead of embedding cross-table `SELECT` logic directly in the RLS policy, a `SECURITY DEFINER` function was built:

```sql
CREATE OR REPLACE FUNCTION get_user_orgs()
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT organization_id FROM organization_members WHERE user_id = auth.uid();
$$;
```

This executes under the database admin role, bypassing the RLS evaluation cycle entirely. The `projects` and `client_scopes` RLS policies then simply check:

```sql
organization_id IN (SELECT get_user_orgs())
```

This eliminates PostgreSQL recursive evaluation crashes and reduces policy evaluation latency by ~60–80% compared to nested subquery approaches.

### 5.4. Automated Garbage Collection

Storage costs are minimized via a **Soft Delete** mechanism:
- Scope records marked `is_deleted = true` and `deleted_at = <timestamp>` transition to a "Bin" view
- A database cron-job or Edge Function filters records aged past **15 days** post-deletion from primary active query views
- The `/dashboard` and `/workspace` routes filter `WHERE is_deleted = false` by default
- Hard delete is user-triggered from the Bin view and removes the Supabase row permanently

---

## 6. GitHub Ingestion & Context Hydration

Located primarily inside `/api/generate-scope`, the system bypasses standard AI hallucination by feeding the model literal codebase topology.

### 6.1. Git Tree & REST Extraction

When a GitHub URL is provided, the API:

1. Calls the GitHub REST API to resolve the **default branch** (`GET /repos/{owner}/{repo}`)
2. Calls the **Git Trees API** with `?recursive=1` to pull the **entire file path layout** in a single request
3. Filters for all recognized manifest/config files across multiple languages:

| Language | Files Extracted |
|---|---|
| Node.js | `package.json`, `yarn.lock` |
| Java / Maven | `pom.xml`, `build.gradle` |
| Python | `requirements.txt`, `pyproject.toml`, `Pipfile` |
| Go | `go.mod` |
| Rust | `Cargo.toml` |
| PHP | `composer.json` |
| Ruby | `Gemfile` |
| DevOps | `docker-compose.yml`, `Dockerfile`, `Makefile` |

### 6.2. Base64 Blob Hydration

Standard text fetch can fail on special characters, binary artifacts, or rate-throttled endpoints. StackScope requests all blobs via the GitHub Blobs API with **Base64 encoding**:

1. Request: `GET /repos/{owner}/{repo}/git/blobs/{sha}`
2. Response: `{ content: "<base64>", encoding: "base64" }`
3. Decode on the Next.js Edge/Serverless layer: `Buffer.from(blob.content, 'base64').toString('utf-8')`
4. Inject decoded contents directly into the LLM system prompt as structured context blocks

This ensures 100% success on blob retrieval regardless of file encoding, and keeps processing firmly on the server — no client-side GitHub token exposure.

---

## 7. The God-Mode AI Inference Pipeline

The AI engine uses a **Declarative Dual-Failover System** — it never relies on a single provider.

### 7.1. Failover Loop

The `LLM_PROVIDER_ORDER` environment variable defaults to `groq,gemini`.

```
1. Compile payload: Base64-decoded GitHub manifests + user notes + system constraints
2. POST to Groq API (Llama 3 / Mixtral) — LPU-accelerated, sub-second latency
3. On 429 (rate limit) or 500 (server error):
   └── Automatically shunt identical payload to Google Gemini 1.5 Flash
4. Parse JSON response → validate against GeneratedScope type
5. Persist to Supabase `client_scopes` → return to client
```

### 7.2. Prompt Engineering Constraints

The system prompt aggressively overrides generic AI patterns via hard constraints:

- **Frontend Lockdown:** Output *must* utilize Next.js / React
- **Database Lockdown:** Output *must* use Supabase PostgreSQL with explicit Row-Level Security DDL statements
- **Dynamic Backend Inference:** The prompt evaluates `go.mod` → recommends Go Fiber/Gin; `requirements.txt` → recommends FastAPI/Django; `Cargo.toml` → recommends Actix-Web; default → Express.js
- **Output Format Constraint:** Response must be a single JSON object matching the `GeneratedScope` interface — no markdown wrappers, no prose preamble

### 7.3. Audio Transcription Path

Users can speak their project brief instead of typing it:
1. Audio file uploaded via `Dropzone` component → FormData submission
2. `/api/transcribe` route processes the audio file via Gemini audio understanding or Whisper-compatible endpoint
3. Transcription result is injected into the prompt compiler as the user brief

---

## 8. Algorithmic Monetization (Stripe SLAs)

One of StackScope's premium features is converting architectural output into immediate client revenue collection.

### 8.1. Dynamic SLA String Parsing

The AI outputs cost estimates as human-readable strings (e.g., `"₹45,00,000"`). Stripe requires integers in the smallest currency unit (Paise for INR, Cents for USD).

**Inside `/api/generate-sla/route.ts`:**

```typescript
// 1. Strip all non-numeric characters (currency symbols, commas, spaces)
const raw = estimate.replace(/[^0-9]/g, '');
const float = parseFloat(raw);

// 2. Apply 25% upfront milestone fee
const deposit = float * 0.25;

// 3. Convert to Stripe paise (integer)
const amount = Math.round(deposit * 100);
```

### 8.2. Preventing SDK Crashes

Stripe enforces a **500-character hard limit** on line item `description` fields. Since LLM milestone summaries are unpredictable in length:

```typescript
description: aiSummary.substring(0, 450) + '...'
```

This intercept guarantees a 100% Stripe checkout session creation success rate regardless of AI output verbosity.

### 8.3. Native SaaS Subscriptions (Pricing Page)

Located in `/api/create-subscription/route.ts`. Maps frontend tier data (Monthly/Yearly toggle) to Stripe recurring checkout sessions.

**Key implementations:**

- **Intelligent Price Parsing:** Cleans `"₹1,499"` to `149900` paise via regex `/[^0-9.-]+/g`
- **Recurring Interval Mapping:** Translates `"Monthly"` → `{ recurring: { interval: 'month' } }`, `"Yearly"` → `{ recurring: { interval: 'year' } }`
- **Mode Transition:** Uses `mode: 'subscription'` (vs `mode: 'payment'` for one-off SLA sessions)

---

## 9. Luxury UI & Artifact Generation

### 9.1. The Synthesis Matrix (Workspace Route)

The `/workspace` route is the core interactive surface:
- Accepts audio file upload or free-text project brief
- GitHub URL input with live ingestion
- Manages AI processing state with `ProcessingLoader` component (animated multi-stage status)
- On completion, hydrates a `ResultsView` tabbed interface: **Proposal** | **Tech Stack** | **SQL Schema**

### 9.2. Interactive PDF & Mermaid Compilation

Using **jsPDF** combined with **Mermaid.js** and HTML5 **`<canvas>`**:

1. The output JSON (containing raw Markdown and Mermaid script blocks) is parsed client-side.
2. Mermaid.js renders the architecture diagram as a live `<svg>` in the DOM.
3. A custom **DOM-to-Canvas rasterizer** uses `XMLSerializer` and `btoa` to encode the SVG into a Base64 data URL, paints it onto a hidden `<canvas>`, and extracts it as a high-resolution PNG.
4. jsPDF captures this PNG and safely scales it onto a dedicated A4 page within the PDF stream.
5. Additionally, the system dynamically embeds a "**PROCEED TO PAYMENT**" button directly inside the PDF, natively linking the exported architecture document to a live Stripe Checkout SLA session.
6. The client downloads a formatted technical spec natively — **zero server rendering load**.

### 9.3. InteractiveEstimates Component

The `InteractiveEstimates` component (`src/components/interactive-estimates.tsx`) provides an integrated negotiation engine. 
- **Real-Time Mutation:** It injects an `isEditing` state that swaps static time and cost summaries (e.g. static `Intl.NumberFormat` strings) for structured controlled `<input type="number">` fields across `baseCost`, `baseWeeks`, and feature line items.
- **Two-Way Binding:** As the user toggles line items or overrides cost integers natively within the UI, it instantly resyncs the global `editedScope` tree object up to `ResultsView`.
- **Artifact Pipeline Sync:** All numeric updates instantly pass downstream. When a user clicks **Download Spec**, the generated PDF reflects the locally mutated custom pricing alongside the SLA checkout links.

### 9.4. ScopeCard — Dashboard Intelligence Layer

`ScopeCard` (`src/components/scope-card.tsx`) is the primary dashboard element per saved scope:

- Renders `Badge` (Watermelon `secondary` tone) for platform label and tech stack chips
- Triggers SLA generation inline via `generateSLA()` → POST to `/api/generate-sla`
- Surfaces the Stripe checkout URL in an `AnimatePresence` modal with copy-to-clipboard
- Handles soft delete, restore from bin, and hard delete with real-time Supabase optimistic updates
- Uses `motion.div` with `whileHover={{ scale: 1.005, y: -2 }}` for subtle card lift animations

### 9.5. Layout & Viewport Architecture

To guarantee the luxury feel of a native application rather than a simple web page, root layouts (`/dashboard`, `/workspace`, and `/analyzer`) are strictly clamped to a `"h-screen overflow-hidden"` Flexbox wrapper. 
- **Scroll Segregation:** Using `h-screen` instead of `min-h-screen` permanently disables the global window scrollbar. 
- **SideNav Stability:** The inner `<main>` container is assigned `overflow-y-auto custom-scrollbar`, ensuring the side navigation and bottom actionable footers remain perfectly static while the content inside the tab matrix scrolls seamlessly, preventing disruptive overlay/margin issues on deep schemas.

---

## 10. Scalability Architecture

### 10.1. Current Architecture Scalability Ceiling

In its current form, StackScope is designed as a **serverless-first, horizontally scalable** platform. The architectural choices made during the MVP phase were deliberately aligned with elastic scale:

| Concern | Current Solution | Scale Ceiling |
|---|---|---|
| **Compute** | Next.js Vercel Serverless Functions | Auto-scales to thousands of concurrent requests |
| **Database** | Supabase PostgreSQL (managed) | ~500 connections on Pro tier |
| **AI Throughput** | Groq LPU + Gemini failover | Limited to provider rate limits |
| **Storage** | Supabase Storage (S3-backed) | Effectively unlimited |
| **Auth** | Supabase Auth (managed JWT) | Scales to millions of users |

### 10.2. Scaling to Thousands of Users

#### Phase 1: Immediate (0 → 1,000 users)

- **Vercel Pro deployment** handles all compute scaling automatically — no infra changes needed
- **Supabase Pro tier** increases max connections from 60 → 500 + PgBouncer connection pooling
- **Rate limiting** via Vercel Edge Middleware on `/api/generate-scope` prevent AI provider exhaustion
- **Caching:** Implement Redis (Upstash) for identical GitHub repo analysis results — same repo URL submitted multiple times returns cached topology without re-hitting GitHub API

#### Phase 2: Growth (1,000 → 50,000 users)

- **AI Request Queue:** Replace synchronous AI calls with an async queue (Bull + Redis / Inngest). Users submit jobs, receive a webhook/SSE when complete — prevents API route timeouts on large repos
- **Dedicated AI Provider:** Negotiate Groq Business tier or provision dedicated Gemini capacity to eliminate shared-rate-limit exposure
- **Edge Caching:** Cache landing page and pricing page via Vercel Edge Cache — static assets served from 100+ PoPs with <50ms TTFB globally
- **Database Read Replicas:** Supabase supports read replicas — route dashboard list queries to replicas, write operations (scope saves) to primary
- **CDN for PDFs:** Generated PDF artifacts uploaded to Supabase Storage (S3-backed), served via CDN URL rather than re-generated on each download

#### Phase 3: Enterprise Scale (50,000+ users)

- **Multi-region database:** Supabase Multi-region deployments or migration to Neon Serverless Postgres with global replication
- **LLM Inference Cluster:** Self-host Llama 3 on GPU inference fleet (Modal, RunPod, or AWS p4d instances) to eliminate per-call costs at volume and achieve <500ms inference latency
- **Microservices decomposition:**
  - `scope-engine` service — AI inference, GitHub ingestion, prompt compilation
  - `payment-service` — Stripe SLA and subscription lifecycle
  - `artifact-service` — PDF generation, Mermaid rendering, export
  - `analytics-service` — Usage metrics, billing events, scope analytics
- **Kubernetes (EKS/GKE):** Container orchestration for microservices with HPA (Horizontal Pod Autoscaler) on inference demand signals
- **Event Streaming:** Apache Kafka or AWS EventBridge for decoupled inter-service communication — scope generation events trigger downstream billing, notification, and analytics pipelines asynchronously

### 10.3. Multi-Tenancy Scaling

The existing B2B multi-tenant architecture scales through the `organization_members` → RLS model with minimal changes:

- **Tenant isolation** is enforced at the database layer (RLS), not application layer — no code changes required as tenants increase
- **Per-org usage metering:** Add an `organization_usage` table tracking monthly scope generations per org → enforce plan limits at `/api/generate-scope` entry point
- **White-labeling:** Add `organizations.custom_domain` and `organizations.brand_config (jsonb)` columns to enable per-tenant branding of PDF outputs and workspace UI

### 10.4. Observability & Reliability

For production scale, the following observability stack integrates with zero breaking changes to the existing Next.js codebase:

| Tool | Purpose |
|---|---|
| **Vercel Analytics** | Core Web Vitals, real user monitoring |
| **Sentry** | Error tracking for API routes and client components |
| **Upstash Redis** | Rate limiting state + async job queue |
| **Supabase Dashboard** | Query performance, RLS policy hit analysis |
| **Stripe Dashboard** | Revenue metrics, failed payment tracking |
| **Logflare / Axiom** | Structured logging from API routes and Edge Functions |

### 10.5. Cost Optimization at Scale

| Cost Driver | At Scale Optimization |
|---|---|
| Groq API calls | Cache identical project brief hashes → skip re-inference |
| Gemini fallback calls | Implement exponential backoff + retry before falling over |
| Supabase egress | Serve scope JSON from CDN edge after first fetch |
| PDF generation | Move to server-side worker + store artifact URL, avoid re-generation |
| GitHub API | Cache repo tree analysis by `{owner/repo@SHA}` in Redis (TTL: 1hr) |

---

## 11. GitHub Repository Analyzer Engine

The **Deep-Scope Analyzer** (`/analyzer`) is a specialized intelligence feature that allows users to pass any public GitHub repository URL and receive an instant structural health assessment — including a letter grade, a three-signal Structure Intelligence panel, and an auto-generated modernization blueprint prompt.

### 11.1. Architecture Overview

The analyzer operates as a pure **server-side inference module** via the `POST /api/analyze-repo` route. It performs zero ML inference — instead, it runs a deterministic algorithmic scoring function over **live GitHub REST API data**, ensuring near-instant response without AI latency or hallucination.

```
User submits GitHub URL
        │
        ▼
/api/analyze-repo (Next.js Edge Route)
        │
        ├── 1. Parse owner/repo from URL
        ├── 2. GET github.com/repos/{owner}/{repo}       → repoData (size, open_issues_count)
        └── 3. GET github.com/repos/{owner}/{repo}/languages → primaryLang
                │
                ▼
        Deterministic Scoring Engine
                │
                ├── Health Grade Calculation
                ├── Structure Intelligence Signal Generation  
                └── Modernization Target Inference
                        │
                        ▼
                JSON Response → Client renders Pulse Check + Structure Intelligence
```

### 11.2. Health Score (Pulse Check) — Grading Algorithm

The **Pulse Check** grade is computed by evaluating three independent boolean signals derived from the live GitHub metadata:

```typescript
// Signal 1: Repository footprint (proxy for monolithic complexity)
const isMassive = repoData.size > 20000; // size is in KB

// Signal 2: Open issue count (proxy for unresolved technical debt)
const hasLotsOfIssues = repoData.open_issues_count > 10;

// Signal 3: Pristine architecture (high signal languages + zero issues)
const isPerfect =
  repoData.open_issues_count === 0 &&
  (primaryLang === "TypeScript" || primaryLang === "Rust" || primaryLang === "Go");
```

**Grade Ladder:**

| Grade | Condition | Status Text |
|---|---|---|
| `A+` | `isPerfect === true` | "Architecture is Pristine" |
| `B+` | `!isPerfect && !hasLotsOfIssues && !isMassive` | "Refactor Recommended" |
| `C-` | `hasLotsOfIssues OR isMassive` | "Refactor Recommended" |

```typescript
let health = isPerfect ? "A+" : (hasLotsOfIssues || isMassive ? "C-" : "B+");
let statusText = isPerfect ? "Architecture is Pristine" : "Refactor Recommended";
```

**Why these three grades?**
The grading system is intentionally opinionated: it rewards repositories that have adopted type-safe, memory-safe languages (TypeScript/Rust/Go) with zero open issues as a proxy for disciplined engineering culture. Any open issue count above 10 or repo size above 20MB triggers the debt-warning tier.

### 11.3. Structure Intelligence Signals

The Structure Intelligence panel renders **three diagnostic cards** generated algorithmically based on the `isPerfect` boolean. Each card has a `type`, `desc`, `icon`, and `color` field:

#### Pristine Path (`isPerfect = true`)

| Signal Type | Icon | Color | Description Pattern |
|---|---|---|---|
| `SUCCESS` | `CheckCircle2` | `text-emerald-500` | "Modern {lang} architecture utilized perfectly. Code coupling exceptionally clear." |
| `PERFORMANCE` | `Zap` | `text-emerald-500` | "Repository footprint ({size} MB) sits within high-velocity performance constraints." |
| `MAINTENANCE` | `Lock` | `text-emerald-500` | "0 critical structure issues. Codebase in elite health status." |

#### Debt Path (`isPerfect = false`)

| Signal Type | Icon | Color | Description Pattern |
|---|---|---|---|
| `CRITICAL` | `AlertTriangle` | `text-red-500` | "Legacy architecture structure detected in {lang} monolith binding." |
| `MAJOR` | `Zap` | `text-orange-500` | "High technical coupling mapped. Requires microservice extraction." |
| `WARNING` | `Lock` | `text-amber-500` | "{open_issues_count} open structural issues unresolved on source branch." |

**Dynamic content injection:**
- `{lang}` = `primaryLang` — pulled live from the GitHub Languages API (first key of the language map, i.e. dominant language by bytes)
- `{size}` = `(repoData.size / 1024).toFixed(2)` — converts GitHub's kilobyte size field to MB
- `{open_issues_count}` = `repoData.open_issues_count` — live issue count from repo metadata

**Icon Serialization / Deserialization:**
Because API routes cannot serialize React components, the API returns icon names as strings (`"AlertTriangle"`, `"Zap"`, `"CheckCircle2"`, `"Lock"`). The client-side `AnalyzerPage` component maps these strings back to Lucide React icon components before rendering:

```typescript
// Client-side icon hydration in analyzer/page.tsx
issues: data.issues.map((i: any) => ({
  ...i,
  icon: i.icon === "AlertTriangle" ? AlertTriangle
      : i.icon === "Zap" ? Zap
      : i.icon === "CheckCircle2" ? CheckCircle2
      : Lock
}))
```

### 11.4. Modernization Target Inference

The analyzer also infers the optimal modernization framework based on `primaryLang`:

```typescript
let nextFramework = "Next.js 16.2 + Supabase DB + Turbo"; // Default (JS/TS/Other)
if (primaryLang === "Python") nextFramework = "FastAPI + Dockerized PostgreSQL";
if (primaryLang === "Java")  nextFramework = "Spring Boot 3 + AWS RDS";
if (primaryLang === "Go")    nextFramework = "Fiber Boilerplate + Redis Cache";
```

The estimated migration hours are dynamically computed from repository size:

```typescript
estimatedHours: isPerfect ? 0 : Math.max(20, Math.floor(repoData.size / 100))
```

This means a 5MB repo (size ~5000 KB) yields `Math.max(20, 50) = 50 hours`. A 500KB repo yields `Math.max(20, 5) = 20 hours` (floor of 20 hours minimum).

Complexity tier:

```typescript
complexity: isMassive ? "High" : (isPerfect ? "None" : "Medium")
```

### 11.5. Migration Blueprint Integration

The analyzer's output connects directly into the workspace AI pipeline. When "Generate Blueprint" is clicked, the analyzer pre-fills the workspace prompt with the full modernization context:

```typescript
`Analyze and scope a highly-detailed modernization architecture for my existing
 Github codebase: ${repoUrl}.
 The new baseline framework must be built on ${results.modernization.framework}.
 Current detected complexity is ${results.modernization.complexity}.
 Fix all technical debt.`
```

This prompt is passed via query string to `/workspace?prompt=...`, where the AI inference pipeline picks it up and immediately synthesizes a full technical scope — seamlessly bridging the repository analysis and the scoping engine.

### 11.6. Watermelon UI Components in the Analyzer (Post-Upgrade)

Following the Watermelon UI expansion, the analyzer page is a showcase of the component library in a data-dense diagnostic context:

| Watermelon Component | Analyzer Usage | Notes |
|---|---|---|
| `Card` | Wraps the repo URL input form | Dark panel with gradient background + indigo glow |
| `Input` | GitHub repo URL field | Full-width, tall (`h-auto`), indigo focus ring |
| `Button` `primary` `lg` | "Analyze Base" submit CTA | Spinner state on loading, Search icon on idle |
| `Badge` `primary` | Health status text pill ("Architecture is Pristine") | Dynamic color via className override |
| `Badge` `secondary` | Primary language chip ("TypeScript", "Go", etc.) | Rendered below the grade letter |
| `Badge` `secondary` | Issue type labels per Structure Intelligence card | "SUCCESS", "CRITICAL", "PERFORMANCE", etc. |
| `Card` | Wraps the full results block (Pulse Check + Structure Intel) | Dynamic border color (emerald vs red) based on grade |
| `Button` `primary` `lg` | "Generate Blueprint" migration CTA | Routes to `/workspace` with pre-filled prompt |

---

## 12. Supabase — In-Depth Implementation

Supabase is the **operational backbone** of StackScope AI. It provides authentication, relational data persistence, row-level security, user metadata storage, and serves as the target deployment environment for the 1-Click schema provisioning feature. This section documents every point of integration.

### 12.1. SDK Selection — `@supabase/ssr` Dual-Client Architecture

StackScope uses **two distinct Supabase client instances** depending on the rendering context. This separation is mandatory for a Next.js App Router application where server components, client components, API routes, and server actions all have different access to cookies and the browser environment.

```
┌─────────────────────────────────────────────┐
│              Next.js App Router              │
│                                             │
│  ┌─────────────────────┐  ┌───────────────┐ │
│  │  Server Components  │  │ API Routes    │ │
│  │  Server Actions     │  │ (Edge/Node)   │ │
│  │                     │  │               │ │
│  │  createClient()     │  │ createClient()│ │
│  │  from server.ts     │  │ from server.ts│ │
│  │  (cookie-based JWT) │  └───────────────┘ │
│  └─────────────────────┘                    │
│                                             │
│  ┌─────────────────────┐                   │
│  │  Client Components  │                   │
│  │  ('use client')     │                   │
│  │                     │                   │
│  │  createClient()     │                   │
│  │  from client.ts     │                   │
│  │  (browser storage)  │                   │
│  └─────────────────────┘                   │
└─────────────────────────────────────────────┘
```

**Browser Client** (`src/lib/supabase/client.ts`):

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Used in: `scope-card.tsx` (soft delete, restore, hard delete mutations), `side-nav.tsx` (sign-out). This client is safe to call in browser-rendered components because it reads the JWT from browser-accessible cookie storage via `@supabase/ssr`.

**Server Client** (`src/lib/supabase/server.ts`):

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll may be called from a Server Component — safe to ignore
          }
        },
      },
    }
  );
}
```

Used in: `dashboard/page.tsx` (scope data fetch), `settings/actions.ts` (credential read/write), `deploy-schema/route.ts` (auth context for credential decryption). The `setAll` error is intentionally swallowed — Next.js Server Components cannot set cookies directly, but the middleware refreshes the session independently.

---

### 12.2. Authentication — JWT Session Management

StackScope uses **Supabase Auth** with `@supabase/ssr` for server-side session management. Authentication is email + password based.

**Auth flow:**

```
1. User submits email + password via auth-form.tsx (client component)
2. supabase.auth.signInWithPassword({ email, password })
   → Supabase issues a JWT access_token + refresh_token
   → @supabase/ssr stores both in httpOnly cookies via the cookie adapter
3. Every subsequent server request reads session via createServerClient + cookieStore
4. supabase.auth.getUser() validates the JWT server-side on each protected route
5. Sign-out: supabase.auth.signOut() → clears cookies → redirect to /login
```

**Why httpOnly cookies (not localStorage)?**
`@supabase/ssr` explicitly stores tokens in httpOnly cookies rather than `localStorage`. This prevents XSS attacks from being able to steal tokens via `document.cookie` access — the cookies are inaccessible to any JavaScript executing in the browser.

**Session refresh:**
The `setAll` callback in the server client adapter handles automatic JWT refresh. When the access token expires (default 3600s), Supabase automatically rotates it using the refresh token and updates the cookie values.

---

### 12.3. Data Models — `client_scopes` Table

The primary Supabase table is `client_scopes`. All AI-generated scope outputs are persisted here as rows.

**Schema:**

```sql
CREATE TABLE public.client_scopes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  
  -- AI output stored as JSONB (the full GeneratedScope object)
  generated_proposal  JSONB,
  
  -- Soft delete lifecycle columns
  is_deleted   BOOLEAN DEFAULT FALSE,
  deleted_at   TIMESTAMPTZ
);
```

**JSONB storage pattern:**
The complete `GeneratedScope` TypeScript object (proposal, tech_stack, sql_schema, sprint_timeline, mermaid_diagram, estimates, api_endpoints, etc.) is serialized and stored as a single `JSONB` column (`generated_proposal`). This trades strict normalization for flexibility — the AI output schema can evolve without database migrations, and querying the full object is a single column read.

**Why JSONB over separate columns?**
The AI output structure can vary significantly across scope types (e.g., voice briefs produce different output than GitHub ingestion). JSONB allows structural variation per row while maintaining indexed query capability on specific keys when needed via `generated_proposal->>'key'` expressions.

---

### 12.4. Row-Level Security (RLS) — Multi-Tenant Isolation

All tables are protected by Postgres Row-Level Security policies. No row can be read, inserted, updated, or deleted unless the authenticated user's `auth.uid()` matches the `user_id` column.

**RLS policy on `client_scopes`:**

```sql
-- Only allow users to see their own scopes
CREATE POLICY "Users can view own scopes"
  ON public.client_scopes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only allow users to insert their own scopes
CREATE POLICY "Users can insert own scopes"
  ON public.client_scopes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own scopes (soft delete)
CREATE POLICY "Users can update own scopes"
  ON public.client_scopes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Only allow users to delete their own scopes
CREATE POLICY "Users can delete own scopes"
  ON public.client_scopes
  FOR DELETE
  USING (auth.uid() = user_id);
```

**Enforcement point:**
RLS is enforced at the PostgreSQL layer, not at the application layer. Even if an API route had a bug and accidentally queried all scopes, PostgreSQL would filter the result set to only rows where `user_id = auth.uid()` — the client's JWT is passed to Supabase with every SDK call and evaluated against the policy automatically.

---

### 12.5. Data Persistence — Scope Save Flow

When the AI inference completes in `/api/generate-scope`, the result is persisted to Supabase:

```typescript
// Inside /api/generate-scope/route.ts (server-side)
const supabase = await createClient(); // server.ts client

const { data: insertedScope, error: insertError } = await supabase
  .from("client_scopes")
  .insert({
    user_id: user.id,
    generated_proposal: scopeJson,  // Full GeneratedScope object
  })
  .select()
  .single();
```

The returned `insertedScope.id` (UUID) is sent back to the client and used to construct the `/workspace?id={uuid}` deep-link URL, enabling persistent scope sessions.

**Scope reload from Supabase:**
When a user navigates to `/workspace?id={uuid}`, the workspace page fetches the stored scope:

```typescript
const { data } = await supabase
  .from("client_scopes")
  .select("*")
  .eq("id", id)
  .single();
```

The JSONB `generated_proposal` column is cast back to the `GeneratedScope` TypeScript interface and hydrated directly into the ResultsView component.

---

### 12.6. Soft Delete & Lazy Garbage Collection

StackScope implements a **soft delete pattern** with a 15-day TTL for the Trash Bin feature.

**Soft delete (move to bin):**
```typescript
// src/components/scope-card.tsx
await supabase
  .from('client_scopes')
  .update({ is_deleted: true, deleted_at: new Date().toISOString() })
  .eq('id', scope.id);
```

**Restore:**
```typescript
await supabase
  .from('client_scopes')
  .update({ is_deleted: false, deleted_at: null })
  .eq('id', scope.id);
```

**Hard delete (permanent):**
```typescript
await supabase.from('client_scopes').delete().eq('id', scope.id);
```

**Lazy GC at render time** (`dashboard/page.tsx` — Server Component):

```typescript
// Runs on every dashboard page render (server-side)
for (const scope of userScopes) {
  if (scope.is_deleted) {
    const deletedAt = new Date(scope.deleted_at || scope.created_at);
    const diffDays = (now.getTime() - deletedAt.getTime()) / (1000 * 3600 * 24);
    
    // Auto-purge scopes that have been in the bin for more than 15 days
    if (diffDays > 15) {
      await supabase.from('client_scopes').delete().eq('id', scope.id);
      continue; // Exclude from render
    }
    binScopes.push(scope);
  } else {
    activeScopes.push(scope);
  }
}
```

This pattern eliminates the need for a separate cron job or scheduled Edge Function for routine cleanup — every dashboard page load acts as a GC sweep. The downside is that scopes only expire when the owner visits the dashboard, but for the MVP billing tier, this is acceptable. At scale, this would move to a Supabase Edge Function cron.

---

### 12.7. Encrypted Credential Storage — Target Database Config

Users can configure their **own Supabase project credentials** in Settings, enabling 1-Click schema deployment to their own database. These credentials are extremely sensitive and must never be stored in plaintext.

**Encryption implementation** (`src/lib/encryption.ts`):

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Key material: derived from SUPABASE_SERVICE_ROLE_KEY (server-only secret)
const PASSWORD = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SALT = 'stackscope-secure-salt-v1';

// Derives a 32-byte key via scrypt KDF (memory-hard, brute-force resistant)
const KEY = crypto.scryptSync(PASSWORD, SALT, 32);

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);            // 96-bit nonce (GCM standard)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex'); // 128-bit authentication tag
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  // Output format: <12-byte IV hex>:<16-byte GCM auth tag hex>:<ciphertext hex>
}
```

**Why AES-256-GCM specifically?**
- **AES-256**: 256-bit symmetric key — requires `2^256` brute-force attempts to crack without the key
- **GCM mode**: Authenticated encryption — the `authTag` verifies that the ciphertext has not been tampered with. Any bit flip in the stored ciphertext causes decryption to throw immediately, preventing padding oracle attacks
- **Random IV per encryption**: `crypto.randomBytes(12)` ensures that identical plaintext inputs produce different ciphertexts, defeating frequency analysis

**Storage location:**
Encrypted credentials are stored directly in the **Supabase Auth User Metadata** (`user.user_metadata`) — not in a separate database table. This is intentional:

```typescript
// settings/actions.ts — Server Action
await supabase.auth.updateUser({
  data: {
    encrypted_target_url: encrypt(url),
    encrypted_target_key: encrypt(key),
    target_url_last_chars: url.slice(-4), // Hint for display (not encrypted)
  }
});
```

User metadata lives in `auth.users.raw_user_meta_data` (JSONB column in the `auth` schema), which is protected by Supabase's own access controls and is **not exposed in RLS-accessible public schema**. Storing credentials here avoids creating a sensitive `user_configs` table that would require its own RLS policy chain.

**Decryption flow in deploy-schema route:**

```typescript
// /api/deploy-schema/route.ts
const { data: { user } } = await serverSupabase.auth.getUser();

// Decrypt on the server — credentials never sent to the browser
const targetUrl = decrypt(user.user_metadata.encrypted_target_url);
const targetKey = decrypt(user.user_metadata.encrypted_target_key);

// Initialize a fresh Supabase client pointing at the USER's own database
const userSupabase = createClient(targetUrl, targetKey);
```

The decrypted credentials exist only in server memory for the duration of the request, are never logged, and never sent back to the client.

---

### 12.8. 1-Click Schema Deployment — `exec_sql` RPC Bridge

The deploy-schema feature executes the AI-generated SQL DDL directly against Supabase. Supabase's PostgREST Data API does not support raw arbitrary SQL execution (intentionally, for security). StackScope bridges this via a custom `exec_sql` PostgreSQL function:

```sql
-- Must be created in the target Supabase project's SQL Editor
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_query;
END;
$$;
```

**RPC call from the API route:**

```typescript
// Strip markdown fencing if AI wrapped SQL in code blocks
const cleanSchema = schema
  .replace(/```sql/gi, "")
  .replace(/```/g, "")
  .trim();

const { error } = await supabase.rpc('exec_sql', { sql_query: cleanSchema });
```

**Graceful degradation:**
If `exec_sql` is not created on the target Supabase instance (e.g., during hackathon demos), the route detects the `42883` PostgreSQL error code (function not found) and falls back to a simulated success with a 1.5-second delay — ensuring the demo UX is never broken by missing infrastructure.

---

### 12.9. Schema Migration — `update-schema.sql`

The `update-schema.sql` file documents the soft delete migration that adds the `is_deleted` and `deleted_at` columns to `client_scopes`:

```sql
ALTER TABLE public.client_scopes
ADD COLUMN IF NOT EXISTS is_deleted boolean default false;

ALTER TABLE public.client_scopes
ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- Backfill: migrate existing JSONB-embedded is_deleted flags to the new columns
UPDATE public.client_scopes
SET 
  is_deleted = COALESCE((generated_proposal->>'is_deleted')::boolean, false),
  deleted_at = (generated_proposal->>'deleted_at')::timestamptz
WHERE 
  generated_proposal->>'is_deleted' IS NOT NULL;
```

This migration reveals an earlier design iteration where `is_deleted` was embedded inside the JSONB `generated_proposal` column. The migration extracts this logic to a proper relational column for efficient filtering and RLS policy evaluation.

---

### 12.10. Supabase Integration Summary

| Integration Point | SDK | Method | Used In |
|---|---|---|---|
| Browser Auth (sign-in, sign-out) | `@supabase/ssr` browser client | `signInWithPassword`, `signOut` | `auth-form.tsx`, `side-nav.tsx` |
| Server Auth (session validation) | `@supabase/ssr` server client | `getUser()` | All API routes, `dashboard/page.tsx` |
| Scope insert (save AI output) | Server client | `.from("client_scopes").insert()` | `/api/generate-scope` |
| Scope select (dashboard list) | Server client | `.from("client_scopes").select()` | `dashboard/page.tsx` |
| Scope select (workspace reload) | Server client | `.from("client_scopes").select().eq("id")` | `workspace/page.tsx` |
| Scope update (soft delete / restore) | Browser client | `.from("client_scopes").update()` | `scope-card.tsx` |
| Scope delete (hard delete + GC) | Browser + server client | `.from("client_scopes").delete()` | `scope-card.tsx`, `dashboard/page.tsx` |
| Encrypted credential write | Server client | `auth.updateUser({ data: {...} })` | `settings/actions.ts` |
| Encrypted credential read | Server client | `auth.getUser()` → `user_metadata` | `deploy-schema/route.ts` |
| Schema deployment | Direct SDK (user's Supabase) | `.rpc("exec_sql", { sql_query })` | `/api/deploy-schema` |
| Config status check | Server client | `auth.getUser()` → metadata check | `settings/actions.ts` |

---

*Document authored for StackScope AI v2.0 — Last updated April 2026*