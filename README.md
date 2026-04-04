<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" width="80" height="80" alt="StackScope Logo" />
  <h1>🚀 StackScope AI</h1>
  <p><b>A premium cognitive synthesizer and architectural scoping engine designed for Principal Engineers, CTOs, and Agency Owners.</b></p>
  <p>Speak or type your idea. We produce standard 3NF schemas, micro-SaaS blueprints, and instant cloud deployments.</p>
</div>

---

**StackScope natively replaces hundreds of hours of manual spec-writing** by interpreting natural language boundaries or audio briefs, and outputting highly optimized, decoupled architectures in beautiful, interactive PDF artifacts. It's an intelligent God-Mode platform embedding the power of a Principal Engineer right into your client proposal flow.

## ✨ Core Features & Technical Depth

- 🧠 **God-Mode Analyzer:** Automatically extracts a decoupled Stack (Next.js + Best-fit Backend) over highly normalized 3NF PostgreSQL schemas complete with explicit multi-tenant RLS CRUD policies.
- 🚀 **1-Click Supabase Deployment:** Instantly push AI-generated, production-ready SQL schemas directly to any linked Supabase project without leaving your dashboard.
- 💬 **Interactive AI Iteration:** Chat directly with the AI context to refine, patch, or alter generated architectures, features, and tables in real-time.
- 💳 **Multi-Phase Stripe Payment Links:** Fully integrated Stripe billing. Generate shareable, 7-day persistent legally binding payment links mapped to multi-phase milestones (e.g., Phase 1, Phase 2). The UI visually verifies and syncs Paid/Pending statuses natively via Stripe hooks.
- 🏢 **Enterprise DB Setup (B2B Multi-Tenant):** Seamless handling of Workspaces (Organizations), Projects, Role-Based Access Control (RBAC), and Project isolation under PostgreSQL-native Row Level Security.
- 🐙 **Universal GitHub Ingestion:** Provide any GitHub repository URL. The agent actively scrapes structural files across 25+ language stacks—`package.json`, `pom.xml`, `requirements.txt`, `Pipfile`, `docker-compose.yml`, etc.—inferring exact dependencies and blocking AI hallucination.
- ✏️ **Interactive Live Quoting:** Instantly edit the AI-generated Base Weeks, Project Costs, and Options live inside the Estimations matrix before sending to the client.
- 📄 **Luxury PDF Artifacts:** Zero JSON-soup. StackScope produces beautiful, agency-branded, interactive A4 PDF architecture documents containing rasterized Mermaid Architecture Diagrams.
- 🗑️ **Garbage Collection:** "Soft delete" trash bin features that auto-scrub your workspace architecture logs after 15 days via native logic on the Dashboard layer filtering `is_deleted` flags.

---

## 🛠️ Technology Stack (In-Depth)

### ⚡ Framework & Core
- **Next.js 16.2.1 (App Router):** The entire application is built on Next.js App Router (`src/app`), utilizing Server Components, Server Actions, and specialized API routes.
- **TypeScript:** Strict type adherence across the entire database schema, component props, and Stripe SDK payload interfaces.

### 🎨 Styling & UI
- **Tailwind CSS v4:** Heavy utilization of utility classes for granular layout styling, gradients, border styling, and responsive breakdowns.
- **Framer Motion:** High-end, smooth physics-based animations (staggered fade-ins, spring physics, modal overlays) used across the platform.

### 🗄️ Database & Authentication
- **Supabase SSR:** Next.js Server-Side Rendering clients (`@supabase/ssr`) ensuring strongly-typed, secure, cookie-based session management across boundaries.
- **PostgreSQL Database:** Powered by Supabase, the persistent layer implements relational normalized shapes alongside powerful Row Level Security (RLS) logic securing the multi-tenant scoping outputs.

### 🧠 LLM Orchestration
- **Gemini 2.5 Flash / Pro:** Deep context understanding for architecture drafting and advanced validation sequences, structured JSON generation, and interactive chat patching.

### 💵 Payments (Stripe Native)
- **Stripe Node SDK (`stripe`):** Secure server-side processing generating `Products`, `Prices`, `PaymentLinks`, and embedded Checkouts `checkout.sessions` with specific parameters.
- **Multi-Phase Verification:** Custom API polling checking `stripe.paymentLinks.listLineItems` and `stripe.checkout.sessions.list` to securely verify phase completions.

---

## 🚀 Getting Started (Local Setup)

### 1. Prerequisites
- **Node.js** 18+
- **Supabase Project** (Database URL + Anon Key)
- **Google Gemini API Key**
- **Stripe Keys** (Secret Key `sk_test_...` & Publishable Key `pk_test_...`)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` and populate it with the required orchestration parameters:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
GEMINI_API_KEY=AIzaSy...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
GITHUB_TOKEN=... # Optional for Repo Scanning
```

### 4. Database Setup & Synchronization
Execute your Supabase schema definitions inside your Supabase project's SQL Editor to initialize the native B2B Profiles, client scopes, and RLS policies.

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
| `/workspace` | The Synthesis Matrix: Input natural language briefs and generate/iterate Scopes |
| `/dashboard` | Storage Arrays, Lazy Garbage Collection Bin, Architecture History |
| `/pricing` | Tiered pricing matrix mapped to dynamically selectable billing cycles |
| `/settings` | Global configurations, 1-Click deploy credentials, and Profile management |
| `/api/generate-scope` | The primary LLM God Mode Pipeline / Inference API |
| `/api/patch-scope` | Iterative chat-based JSON schema mutation |
| `/api/deploy-schema` | Remote SQL execution tunneling directly to user's Supabase instance |
| `/api/generate-payment-link` | Dynamic Stripe Product/Price generation for Multi-Phase milestone invoicing |
| `/api/check-payment-status` | Iterative Stripe session polling verifying phase checkout completion |

---

## �� Security Posture
- Client architectures are strictly guarded under enterprise-grade **Supabase RLS**. Only validated and joined members are permitted to query projects and scopes connected to that tenant space.
- AI outputs are thoroughly cleansed; the AI specifically validates raw Row Level Security outputs aggressively to protect your downstream deployments.
- Financial transactions are isolated dynamically; raw card numbers are never intercepted by the Next.js server, strictly handled natively via Stripe Checkout / Payment Links.
- 1-Click Deploy credentials (Target URL & Service Keys) are strictly **AES-256-GCM encrypted** before hitting our DB, guaranteeing zero-knowledge retention.

---
<div align="center">
  <i>Built for the modern systems architect. Focus on design, let AI handle the documentation.</i>
</div>
