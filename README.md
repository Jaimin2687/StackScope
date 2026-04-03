<div align="center">
  <h1>🚀 StackScope AI</h1>
  <p><b>A premium cognitive synthesizer and architectural scoping engine designed for Principal Engineers and Agency Owners.</b></p>
  <p>🍉 <b>UI Components proudly powered by <a href="https://ui.watermelon.sh/">ui.watermelon.sh</a></b></p>
</div>

---

**StackScope natively replaces hundreds of hours of manual spec-writing** by interpreting natural language boundaries or audio briefs, and outputting highly optimized, decoupled architectures in beautiful, interactive PDF artifacts. It's an intelligent God-Mode platform embedding the power of a Principal Engineer right into your client proposal flow.

## ✨ Core Features

- 🧠 **God-Mode Analyzer:** Automatically extracts a decoupled Stack (Next.js + Best-fit Backend) over highly normalized 3NF PostgreSQL schemas complete with explicit multi-tenant RLS CRUD policies.
- 🏢 **Enterprise DB Setup (B2B Multi-Tenant):** Seamless handling of Workspaces (Organizations), Projects, Role-Based Access Control (RBAC), and Project isolation under PostgreSQL-native Row Level Security (no infinite recursion loops).
- 🐙 **Universal GitHub Ingestion:** Provide any GitHub repository URL. The agent actively scrapes structural files across 25+ language stacks—`package.json`, `pom.xml`, `requirements.txt`, `Pipfile`, `composer.json`, `CMakeLists.txt`, `Makefile`, `go.mod`, `Cargo.toml`, `Gemfile`, `docker-compose.yml`, `setup.py`—inferring exact dependencies and blocking AI hallucination.
- 🏗️ **Strict Migration Directives:** Employs aggressive contextual overrides during migration tasks. Demands valid raw PostgreSQL RLS statements (SELECT, INSERT, UPDATE, DELETE), maps older legacy stacks entirely over to Next.js + Supabase constructs, and extracts domain entities perfectly.
- 💳 **Micro-SaaS & Stripe SLAs:** Automatically constructs SLA proposal milestones and generates active Stripe Checkout Session links wrapped into PDF Documents and native Next.js UI Modals.
- ✏️ **Interactive Live Quoting:** Instantly edit the AI-generated Base Weeks, Project Costs, and Options live inside the Estimations matrix before sending to the client.
- 📄 **Luxury PDF Artifacts:** Zero JSON-soup. StackScope produces beautiful, agency-branded, interactive A4 PDF architecture documents containing rasterized Mermaid Architecture Diagrams and Stripe Checkout Buttons embedded directly inside.
- 🎙️ **AI Audio Transcoder:** Whisper-level voice integrations convert spoken ideas into hard technical specs.
- 🗑️ **Garbage Collection:** "Soft delete" trash bin features that auto-scrub your workspace architecture logs after 15 days via native PostgreSQL column filtering.

---

## 🛠️ Technology Stack
- **Frontend & API Engine:** Next.js 16.2 (App Router), React, Tailwind CSS
- **Premium UI Components:** [ui.watermelon.sh](https://ui.watermelon.sh/)
- **Auth & Database:** Supabase (PostgreSQL, Row-Level Security)
- **AI Core Inference:** Dual-failover pipeline powered by Groq & Gemini APIs
- **Payment Processing:** Stripe Checkout Integration
- **Context Parsing:** GitHub API (Tree / REST file parsing)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** 18+
- **Supabase Project** (Database URL + Anon Key)
- **LLM API Keys** (Gemini & Groq)
- **Stripe Secret Key** (for SLA checkout flows)
- **GitHub Fine-Grained Token** (for codebase repository scanning)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy the provided `.env.example` to `.env.local` and populate it:
```bash
cp .env.example .env.local
```

### 4. Database Setup & Synchronization
Execute `supabase_schema.sql` inside your Supabase project's SQL Editor. 
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
| `/login` | Core Magic Link / OAuth Authentication Layer |
| `/workspace` | The Synthesis Matrix: Input natural language briefs |
| `/dashboard` | Storage Arrays, Garbage Collection Bin, Architecture History |
| `/api/generate-scope` | The primary LLM God Mode Pipeline / Inference API |
| `/api/generate-sla` | Automated Server-Side Stripe Checkout Generator |

---

## 🔒 Security Posture
- Client architectures are strictly guarded under enterprise-grade **Supabase RLS**. Only validated and joined members of an `organization` are permitted to query projects and scopes connected to that tenant space. 
- AI outputs are thoroughly cleansed; the AI specifically validates raw Row Level Security outputs aggressively to protect your downstream deployments.
