<div align="center">

<br />

```
  ███████╗████████╗ █████╗  ██████╗██╗  ██╗███████╗ ██████╗ ██████╗ ██████╗ ███████╗
  ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝
  ███████╗   ██║   ███████║██║     █████╔╝ ███████╗██║     ██║   ██║██████╔╝█████╗  
  ╚════██║   ██║   ██╔══██║██║     ██╔═██╗ ╚════██║██║     ██║   ██║██╔═══╝ ██╔══╝  
  ███████║   ██║   ██║  ██║╚██████╗██║  ██╗███████║╚██████╗╚██████╔╝██║     ███████╗
  ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚══════╝
```

**A God-Mode AI Scoping Engine for Principal Engineers, CTOs, and Agency Owners.**

*Speak your idea. We produce 3NF schemas, micro-SaaS blueprints, sprint timelines, and instant cloud deployments.*

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-SSR-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini-2.0%20Flash-orange?style=flat-square&logo=google)](https://deepmind.google/technologies/gemini/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Route-blue?style=flat-square&logo=razorpay)](https://razorpay.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-teal?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## What is StackScope?

StackScope natively **replaces hundreds of hours of manual spec-writing** by interpreting natural language text or audio briefs and outputting highly optimized, decoupled architectures as beautiful, interactive documents.

You describe what you want to build — by typing or speaking — and StackScope acts as a **virtual Principal Engineer** embedded directly into your proposal and client workflow:

- Generates a complete, production-grade **technical scope document** with objectives, sprint timelines, and tech stack recommendations
- Produces a deployable **3NF-normalized PostgreSQL schema** with full RLS policies
- Renders a **Mermaid.js architecture diagram** of the entire system topology
- Computes **unit economics** (hosting costs, break-even thresholds, profit margins) calibrated to the Indian market
- Generates a branded **PDF artifact** ready to send to clients
- Creates **Razorpay Payment Links** for multi-phase milestone billing
- Deploys the generated SQL schema **directly to your Supabase project** with one click

---

## ✨ Core Feature Set

### 🧠 AI Scoping Engine (God Mode)
The primary capability of StackScope. Accepts any text or audio brief and generates a complete, implementation-ready scope document. It never refuses vague input — it makes informed, industry-standard assumptions and produces a full specification.

**What it generates:**
- **Proposal** — 2-3 paragraph executive summary + 4-6 clear objectives
- **Sprint Timeline** — 3-6 realistic sprints with task breakdowns for a 2-5 person team
- **Tech Stack** — Dynamically chosen stack (Next.js frontend, best-fit backend), never a one-size-fits-all template
- **SQL Schema** — Production-grade PostgreSQL with UUIDs, triggers, ENUMs, GIN/GiST indexes, RLS, and two-pass FK resolution (no "relation does not exist" errors)
- **Architecture Diagram** — Mermaid.js `graph TD` mapping microservices, queues, caches, CDN layers
- **Unit Economics** — INR-calibrated hosting costs, DB costs, profit margins, break-even user thresholds
- **Scalability Plan** — Step-by-step zero-to-million-user strategy
- **Optional Features** — Toggle-able add-ons with individual cost and timeline impacts

### 🎙️ Voice-to-Architecture (Audio Transcoder)
Upload an audio recording of a client meeting, a voice memo, or any spoken idea. StackScope uses **Groq Whisper (`whisper-large-v3`)** to transcribe it and then pipes the transcript directly into the scoping engine.

### 💬 AI Chat Iteration (Live Patching)
After generating a scope, a floating chat box lets you refine it in real-time. Say *"Add payment integration"* or *"Remove the websocket layer"* and the AI surgically updates only the relevant sections, preserving everything else. Protected by a guardrail that rejects off-topic requests (poems, roleplay, etc.).

### 🐙 Deep-Scope Analyzer (GitHub Intel Ingestion)
Submit any GitHub repository URL. StackScope:
1. Fetches the live repository metadata from the GitHub API (stars, size, language breakdown, open issues)
2. Algorithmically scores the codebase health (`A+`, `B+`, `C-`) based on language, issue volume, and size
3. Identifies architectural issues: critical monolith binding, high coupling, unresolved issues
4. Generates a **Migration Blueprint CTA** — auto-fills the workspace with a detailed prompt to modernize the repo to a modern Next.js + Supabase stack

### 🚀 1-Click Schema Deployment
Connect your Supabase project once (credentials are AES-256-GCM encrypted before storage). From then on, click **"1-Click Deploy"** in the SQL Schema tab to execute the AI-generated DDL directly against your live Supabase database — no copy-paste, no SQL editor.

### 💳 Multi-Phase Razorpay Billing
Generate legally-binding **Razorpay Payment Links** for multi-phase project invoicing directly from any saved scope. Phase 1, Phase 2, etc. Each link is tied to a milestone. The UI tracks `PAID` / `PENDING` statuses per phase with Razorpay sync.

### 📄 Luxury PDF Artifacts
Export any scope as a branded A4 PDF:
- Black premium cover page with project title and executive summary
- Objectives, resource estimates, and tech stack breakdown
- Rasterized Mermaid architecture diagram embedded inline
- Razorpay payment link embedded directly in the PDF
- Branded footer with date and page numbers

### ✏️ Interactive Live Quoting (Inline Editing)
Before exporting, toggle edit mode to directly modify any field in the scope — title, summary, objectives, tech stack, SQL schema — all in-place. Optional add-on features toggle dynamically updating the total cost and timeline matrix.

### 🗑️ Lazy Garbage Collection (Soft Delete Bin)
The dashboard includes a "Bin" with soft-delete mechanics: deleted scopes are flagged with `is_deleted=true` and a `deleted_at` timestamp. Items in the bin can be restored or permanently destroyed. Auto-scrub logic filters items after 15 days.

### 🔐 Authentication & Route Guard
Cookie-based Supabase SSR authentication with Next.js middleware protecting `/workspace`, `/dashboard`, `/analyzer`, and `/settings`. Logged-in users are automatically redirected away from `/login` to `/dashboard`.

---

## 🛠️ Technology Stack

### ⚡ Framework & Runtime
| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Runtime | Node.js 18+ |

### 🎨 Styling & UI
| Layer | Technology |
|---|---|
| CSS Framework | Tailwind CSS v4 |
| Animations | Framer Motion 12 (spring physics, staggered fades, `AnimatePresence`) |
| Icons | Lucide React |
| Component Primitives | ui.watermelon.sh (Badge, Button, Input, Card) |

### 🗄️ Data & Auth
| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (SSR cookie-based sessions via `@supabase/ssr`) |
| ORM | Direct Supabase client (no Prisma) |
| Security | PostgreSQL Row Level Security (RLS) |

### 🧠 LLM Orchestration
| Layer | Technology |
|---|---|
| Primary Inference | Groq API — `llama-3.3-70b-versatile` (ultra-fast, JSON mode) |
| Fallback Inference | Google Gemini 2.0 Flash (structured JSON with response schema enforcement) |
| Audio Transcription | Groq Whisper — `whisper-large-v3` |
| Failover Logic | Configurable provider order via `LLM_PROVIDER_ORDER` env var |

### 💵 Payments
| Layer | Technology |
|---|---|
| Server SDK | Razorpay Node.js SDK |
| Client SDK | Razorpay hosted checkout links |
| Products Used | Razorpay Payment Links (multi-phase milestone billing) |
| Client Experience | Embedded checkout, never leaving the domain |

### 📄 Document Generation
| Layer | Technology |
|---|---|
| PDF Engine | jsPDF v4 (dynamically imported to avoid 400KB+ bundle bloat) |
| Diagram Rendering | Mermaid.js v11 (rendered client-side, rasterized to `canvas` for PDF embedding) |

### 🔐 Security
| Layer | Technology |
|---|---|
| Credential Encryption | AES-256-GCM (`crypto.createCipheriv`) with random IV and auth tag |
| DB Credential Storage | Encrypted in Supabase, decrypted server-side only |
| Auth Boundary | Next.js middleware (`createServerClient` from `@supabase/ssr`) |

---

## 🗺️ Application Routes

| Route | Type | Description |
|---|---|---|
| `/` | Public | Landing page with animated hero, feature showcase, and CTA |
| `/login` | Public | Supabase email/password authentication |
| `/workspace` | Protected | The Synthesis Matrix — input → generate → iterate scopes |
| `/analyzer` | Protected | GitHub repository health scanner + migration blueprint generator |
| `/dashboard` | Protected | Saved scopes history and soft-delete bin |
| `/settings` | Protected | Profile management and encrypted Supabase deployment credentials |
| `/pricing` | Public | Tiered subscription pricing (monthly / yearly) |
| `/checkout` | Public | Subscription request flow (Razorpay invoice delivery) |
| `/payment` | Public | Payment info page for Razorpay milestone links |

### API Routes

| Route | Method | Description |
|---|---|---|
| `/api/generate-scope` | POST | Primary LLM pipeline — accepts `multipart/form-data` with `brief` or `audio` |
| `/api/patch-scope` | POST | Chat-based surgical scope mutation |
| `/api/analyze-repo` | POST | GitHub repo health scoring and migration blueprint generation |
| `/api/deploy-schema` | POST | Executes AI-generated SQL DDL against linked Supabase project |
| `/api/generate-payment-link` | POST | Creates Razorpay Orders + Payment Links for multi-phase billing |
| `/api/check-payment-status` | POST | Polls Razorpay to sync phase payment statuses |
| `/api/razorpay/onboard` | POST | Creates Razorpay Route accounts for freelancer payouts |
| `/api/docs` | GET | API documentation endpoint |

---

## 🏗️ Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page (hero, feature showcase, CTA)
│   ├── layout.tsx                # Root layout
│   ├── globals.css               # Global styles
│   ├── workspace/page.tsx        # Scope generation workspace
│   ├── analyzer/page.tsx         # GitHub repo inspector
│   ├── dashboard/page.tsx        # Saved scopes + bin
│   ├── settings/                 # Profile + deployment config
│   ├── login/                    # Auth page
│   ├── pricing/                  # Subscription tiers
│   ├── checkout/                 # Razorpay invoice request flow
│   ├── payment/                  # Razorpay milestone info
│   └── api/
│       ├── generate-scope/       # Primary LLM inference
│       ├── patch-scope/          # Chat-based scope mutation
│       ├── analyze-repo/         # GitHub health scoring
│       ├── deploy-schema/        # Supabase SQL execution tunnel
│       ├── generate-payment-link/  # Razorpay multi-phase billing
│       ├── check-payment-status/ # Razorpay status polling
│       ├── razorpay/onboard/      # Razorpay Route onboarding
│       └── docs/                 # API docs
│
├── components/
│   ├── results-view.tsx          # Full scope output renderer (proposal/tech/SQL tabs)
│   ├── scope-card.tsx            # Dashboard scope card (SLA, export, delete, restore)
│   ├── interactive-estimates.tsx # Live cost/timeline quoting matrix
│   ├── mermaid-diagram.tsx       # Dynamically-loaded Mermaid renderer
│   ├── processing-loader.tsx     # Animated generation loading state
│   ├── dropzone.tsx              # Audio file dropzone for voice input
│   ├── auth-form.tsx             # Supabase auth form
│   ├── side-nav.tsx              # App sidebar navigation
│   ├── top-nav.tsx               # Landing page navigation
│   ├── ScopeCheckoutModal.tsx    # Razorpay checkout notice
│   └── ui/watermelon/            # Watermelon UI component primitives
│
└── lib/
    ├── types.ts                  # All TypeScript interfaces (GeneratedScope, etc.)
    ├── llm.ts                    # Dual-provider failover engine (Groq → Gemini)
    ├── gemini.ts                 # Google Gemini API client + structured schema
    ├── transcribe.ts             # Groq Whisper audio transcription
    ├── pdf-generator.ts          # jsPDF-based branded PDF generation
    ├── encryption.ts             # AES-256-GCM encrypt/decrypt for credentials
    ├── utils.ts                  # Shared utilities
    └── supabase/                 # Supabase client (server + browser)

middleware.ts                     # Auth route guard (Supabase SSR)
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- A **Supabase project** (free tier works)
- A **Google AI API key** (Gemini)
- A **Groq API key** (for fast inference + Whisper transcription)
- **Razorpay keys** (for billing features)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/stackscope.git
cd stackscope
npm install
```

### 2. Environment Configuration

Create `.env.local` and populate it:

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...   # Used for AES-256 key derivation

# LLM Providers (at least one required)
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
LLM_PROVIDER_ORDER=groq,gemini        # Failover order — try Groq first, then Gemini
GROQ_SCOPE_MODEL=llama-3.3-70b-versatile

# Razorpay (optional — required for billing features)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...

# GitHub (optional — required for repo analysis)
GITHUB_TOKEN=ghp_...
```

### 3. Database Setup

In your Supabase project's **SQL Editor**, execute the schema definitions to initialize:
- `profiles` — User profile metadata linked to `auth.users`
- `organizations` — B2B workspace/tenant containers
- `organization_members` — RBAC membership with `owner / admin / member` roles
- `projects` — Project groupings under organizations
- `client_scopes` — The primary scope storage with `generated_proposal` (JSONB), `raw_brief`, `target_language`, `is_deleted`, `deleted_at`

All tables include `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` and explicit CRUD policies securing multi-tenant data isolation.

### 4. Run Locally

```bash
npm run dev
```

App starts at `http://localhost:3000`.

---

## 🔒 Security Architecture

**Multi-Layer Security Model:**

| Layer | Mechanism |
|---|---|
| **Route Protection** | Next.js middleware validates Supabase session cookie on every protected request |
| **Data Isolation** | PostgreSQL RLS policies enforce tenant-level row filtering — users can only query their own scopes |
| **Credential Storage** | Supabase deployment credentials (URL + Service Key) are AES-256-GCM encrypted with a random 96-bit IV before being stored in the database |
| **Payment Processing** | Raw card numbers are never handled server-side — Razorpay hosts the checkout experience |
| **AI Output Guardrails** | The patch endpoint rejects off-topic modification requests and only accepts architecture-related changes |

---

## 🧠 LLM Architecture Deep Dive

### Dual-Provider Failover (`src/lib/llm.ts`)

The generation pipeline uses a **cascading provider system** configured via `LLM_PROVIDER_ORDER`:

```
Input Brief / Transcript
        ↓
  [Provider: Groq]  ── JSON mode → llama-3.3-70b-versatile
        ↓ (on failure / rate limit)
  [Provider: Gemini] ── Structured response schema → gemini-2.0-flash
        ↓
  JSON Extraction + Shape Validation
        ↓
  GeneratedScope Object
```

- **Groq** is attempted first for sub-second response times using native JSON mode
- **Gemini** acts as a resilient fallback with enforced response schema validation (`SchemaType.OBJECT` constraints)
- Both providers use the same detailed system prompt enforcing decoupled architectures, 3NF schemas, RLS policies, and INR-calibrated economics
- If all providers fail, the error is surfaced with per-provider failure details

### Audio Pipeline (`src/lib/transcribe.ts`)

```
Audio File (mp3, wav, webm, m4a)
        ↓
  Groq Whisper API (whisper-large-v3)
        ↓
  Transcript Text
        ↓
  LLM Inference (as text input)
```

---

## 📊 Generated Scope Data Model

All generated scopes conform to `GeneratedScope` in `src/lib/types.ts`:

```typescript
interface GeneratedScope {
  providerUsed?: "groq" | "gemini";
  proposal: {
    title: string;
    summary: string;         // 2-3 executive paragraphs
    objectives: string[];    // 4-6 business objectives
  };
  sprint_timeline: {
    sprint: number;
    duration: string;        // e.g. "2 weeks"
    tasks: string[];
  }[];
  tech_stack: {
    frontend: string[];
    backend: string[];
    database: string;
    infra: string[];
    detailed_specifications?: string;
  };
  sql_schema: string;        // Raw PostgreSQL DDL (deployable)
  mermaid_diagram?: string;  // Mermaid.js graph TD syntax
  detailed_architecture?: string;
  scalability_plan?: string[];
  unit_economics?: {
    hosting_costs_per_month: string;
    database_costs_per_month: string;
    expected_profit_margin: string;
    break_even_users: number;
  };
  estimates?: {
    base_cost_inr: number;
    base_weeks: number;
    optional_features: OptionalFeature[];
  };
  // Extended fields from Groq:
  assumptions?: string[];
  data_model_summary?: { entities: [...], relationships: string[] };
  api_endpoints?: [...];
  security?: { rls_notes, auth_flow, ... };
}
```

---

## ⚙️ Configuration Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon/public role key |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Used as AES-256 key derivation source for credential encryption |
| `GEMINI_API_KEY` | ✅* | Google Gemini API key |
| `GROQ_API_KEY` | ✅* | Groq API key (also used for Whisper transcription) |
| `LLM_PROVIDER_ORDER` | Optional | Comma-separated provider order, default `groq,gemini` |
| `GROQ_SCOPE_MODEL` | Optional | Groq model ID, default `llama-3.3-70b-versatile` |
| `RAZORPAY_KEY_ID` | Optional | Required for Razorpay payment link and onboarding features |
| `RAZORPAY_KEY_SECRET` | Optional | Required for Razorpay payment link and onboarding features |
| `GITHUB_TOKEN` | Optional | Fine-grained PAT for GitHub API (higher rate limits on analyzer) |

*At least one LLM provider key is required.

---

## 🧩 Key Components

### `ResultsView` (`src/components/results-view.tsx`)
The primary scope output renderer. Three tabs: **Architecture** (proposal, economics, diagram, sprint timeline), **Tech Stack** (interactive badges), and **Schema** (editable SQL with 1-click deploy). Includes a floating AI chat bar for live patching.

### `ScopeCard` (`src/components/scope-card.tsx`)
Dashboard card for saved scopes. Actions: open in workspace, generate milestone payment link, export PDF, soft delete. Includes multi-phase payment status tracking with Razorpay sync.

### `InteractiveEstimates` (`src/components/interactive-estimates.tsx`)
Live quoting matrix. Displays base cost + timeline with toggleable optional features. Each toggle updates the total cost and timeline in real-time before the client receives the proposal.

### `MermaidDiagram` (`src/components/mermaid-diagram.tsx`)
Dynamically imported (code-split) Mermaid renderer. Renders the AI-generated architecture diagram client-side and exposes the rendered SVG via a DOM `id` so the PDF generator can rasterize it.

---

<div align="center">

**Built for the modern systems architect. Focus on design, let AI handle the documentation.**

*StackScope AI — © 2026 All Rights Reserved*

</div>
