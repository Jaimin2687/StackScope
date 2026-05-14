<div align="center">
  <h1>🚀 StackScope AI</h1>
  <p><b>A premium cognitive synthesizer and architectural scoping engine designed for Principal Engineers and Agency Owners.</b></p>
  <p>🍉 <b>UI Components proudly powered by <a href="https://ui.watermelon.sh/">ui.watermelon.sh</a></b></p>
</div>

---

**StackScope natively replaces hundreds of hours of manual spec-writing** by interpreting natural language boundaries or audio briefs, and outputting highly optimized, decoupled architectures in beautiful, interactive PDF artifacts. It's an intelligent God-Mode platform embedding the power of a Principal Engineer right into your client proposal flow.

## ✨ Core Features & Technical Depth

- 🧠 **God-Mode Analyzer:** Automatically extracts a decoupled Stack (Next.js + Best-fit Backend) over highly normalized 3NF PostgreSQL schemas complete with explicit multi-tenant RLS CRUD policies.
- 🏢 **Enterprise DB Setup (B2B Multi-Tenant):** Seamless handling of Workspaces (Organizations), Projects, Role-Based Access Control (RBAC), and Project isolation under PostgreSQL-native Row Level Security (no infinite recursion loops).
- 🐙 **Universal GitHub Ingestion:** Provide any GitHub repository URL. The agent actively scrapes structural files across 25+ language stacks—`package.json`, `pom.xml`, `requirements.txt`, `Pipfile`, `composer.json`, `CMakeLists.txt`, `Makefile`, `go.mod`, `Cargo.toml`, `Gemfile`, `docker-compose.yml`, `setup.py`—inferring exact dependencies and blocking AI hallucination.
- 🏗️ **Strict Migration Directives:** Employs aggressive contextual overrides during migration tasks. Demands valid raw PostgreSQL RLS statements (SELECT, INSERT, UPDATE, DELETE), maps older legacy stacks entirely over to Next.js + Supabase constructs, and extracts domain entities perfectly.
- 💳 **Deep Integrated Razorpay Billing:** Secure Razorpay payment links and invoices mapped directly into the platform without third-party redirects.
  - **SLA Milestones:** Handled via Razorpay Orders + Payment Links for multi-phase client approvals.
  - **Pro Subscriptions:** Issued as Razorpay invoices with secure payment links tied to plan selection.
- ✏️ **Interactive Live Quoting:** Instantly edit the AI-generated Base Weeks, Project Costs, and Options live inside the Estimations matrix before sending to the client.
- 📄 **Luxury PDF Artifacts:** Zero JSON-soup. StackScope produces beautiful, agency-branded, interactive A4 PDF architecture documents containing rasterized Mermaid Architecture Diagrams and Razorpay payment links embedded directly inside.
- 🎙️ **AI Audio Transcoder:** Whisper-level voice integrations convert spoken ideas into hard technical specs.
- 🗑️ **Garbage Collection (Lazy GC):** "Soft delete" trash bin features that auto-scrub your workspace architecture logs after 15 days via native logic on the Dashboard layer filtering `is_deleted` flags and timestamp diffs.

---

## 🛠️ Technology Stack (In-Depth)

### ⚡ Framework & Core
- **Next.js 16 (App Router):** The entire application is built on Next.js App Router (`src/app`), utilizing Server Components, Server Actions, and specialized API routes for complex background generation tasks.
- **TypeScript:** Strict type adherence across the entire database schema and component props.

### 🎨 Styling & UI
- **Tailwind CSS v4:** Heavy utilization of utility classes for granular layout styling, gradients, border styling, and responsive breakdowns.
- **Framer Motion:** High-end, smooth physics-based animations (staggered fade-ins, spring physics) used across the marketing & pricing layers.
- **Lucide React:** Consistent, clean vector icon suite.
- **ui.watermelon.sh:** Curated, highly polished custom UI components (Badges, Inputs, Form factors) ensuring a dark-mode luxury aesthetic.

### 🗄️ Database & Authentication
- **Supabase SSR:** Next.js Server-Side Rendering clients (`@supabase/ssr`) ensuring strongly-typed, secure, cookie-based session management across boundaries.
- **PostgreSQL Database:** Powered by Supabase, the persistent layer implements relational normalized shapes alongside powerful Row Level Security (RLS) logic securing the multi-tenant scoping outputs.

### 🧠 LLM Orchestration
- **Dual-Failover Inference Engine:** Routes natural language scoping processes through a provider cascading logic system.
- **Groq API:** Leverages ultra-fast Llama-3.3-70b-versatile for rapid baseline structure synthesis.
- **Gemini API:** Deep context understanding for architecture drafting and advanced validation sequences.

### 💵 Payments (Razorpay Route)
- **Razorpay Node SDK (`razorpay`):** Secure server-side processing generating Orders, Payment Links, and Route transfers for split payouts.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** 18+
- **Supabase Project** (Database URL + Anon Key)
- **LLM API Keys** (Gemini & Groq)
- **Razorpay Keys** (Key ID `rzp_test_...` & Secret Key)
- **GitHub Fine-Grained Token** (for codebase repository scanning)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` and populate it with the required orchestration parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GEMINI_API_KEY=...
GROQ_API_KEY=...
LLM_PROVIDER_ORDER=groq,gemini
GROQ_SCOPE_MODEL=llama-3.3-70b-versatile
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
GITHUB_TOKEN=...
```

### 4. Database Setup & Synchronization
Execute your Supabase schema definitions inside your Supabase project's SQL Editor. 
*This initializes the native B2B Profiles, Organizations, Members, Projects, and Scopes schema, securely binding it together using Row-Level Security profiles that specifically halt deep Infinite Recursion traps.*

### 5. Launch the Development Server
```bash
npm run dev
```
The platform will automatically spin up locally at `http://localhost:3000`.

---

## 🗺️ Key Routes Architecture
| Route | Description |
|---|---|
| `/login` | Core Authentication Layer mapped to Supabase |
| `/workspace` | The Synthesis Matrix: Input natural language briefs and generate Scopes |
| `/dashboard` | Storage Arrays, Lazy Garbage Collection Bin, Architecture History |
| `/pricing` | Tiered pricing matrix mapped to dynamically selectable billing cycles |
| `/checkout` | Client-side wrapper for Razorpay subscription invoice requests |
| `/payment` | Secure environment describing Razorpay milestone payment flow |
| `/api/generate-scope` | The primary LLM God Mode Pipeline / Inference API |
| `/api/create-subscription` | Generates Embedded Checkout `client_secret` payloads |
| `/api/create-payment-intent` | Generates standard `client_secret` payloads for Native Elements |

---

## 🔒 Security Posture
- Client architectures are strictly guarded under enterprise-grade **Supabase RLS**. Only validated and joined members of an `organization` are permitted to query projects and scopes connected to that tenant space. 
- AI outputs are thoroughly cleansed; the AI specifically validates raw Row Level Security outputs aggressively to protect your downstream deployments.
- Financial transactions are isolated dynamically; raw card numbers are never intercepted by the Next.js server, strictly handled by Razorpay-hosted checkout.
