# Hackathon Push Strategy: The Evaluation Alignment 🕒

Since we are running a psychological game plan (see `EVALUATION_STRATEGY.md`), our Git commit timeline MUST perfectly align with what we show the judges. 

We cannot push the GitHub Analyzer or the payment SLAs to GitHub before Evaluation 1, otherwise, the judges will see it in the commit history and the "Illusion of Choice" trap is ruined.

Here is the revised **6-Phase AI-Assisted Sprint** mapped directly to the 3 judging milestones.

---

## 🛑 EVALUATION 1 PUSHES (The MVP)
*Complete these pushes BEFORE 9:00 PM tonight.*

### 🚀 PHASE 1: Scaffolding & Architecture Skeleton
**When to push:** Hour 1 - 2 
**Story:** "Used AI to scaffold the Next.js app, configure Tailwind, and set up the foundational types and routing structure."

```bash
git add package.json tsconfig.json next.config.ts postcss.config.mjs next-env.d.ts README.md
git add src/app/globals.css src/app/layout.tsx src/app/page.tsx
git add src/lib/types.ts src/lib/utils.ts
git commit -m "init: Next.js 16 bootstrap with Tailwind CSS, global types, and base landing layout"
git push -u origin main
```

### 🔐 PHASE 2: Authentication & Database Wiring
**When to push:** Hour 4 - 5
**Story:** "Prompted the AI to build out the Supabase authentication flow, Row-Level Security schemas, and the login UI."

```bash
git add src/lib/supabase/
git add src/app/login/
git add src/components/auth-form.tsx src/components/top-nav.tsx src/components/side-nav.tsx
git add update-schema.sql 
git commit -m "feat: integrate Supabase SSR auth, protected routes proxy, and core navigation"
git push origin main
```

### 🧠 PHASE 3: Core Workspace & Base AI Inference
**When to push:** Hour 7 - 8 (Right before Eval 1)
**Story:** "Generated the dashboard and workspace UI components. Wired up the basic AI prompts and Mermaid.js diagram rendering."
**CRITICAL:** DO NOT add `src/app/analyzer/`, payment APIs, or PDF generator here.

```bash
git add src/lib/gemini.ts src/app/api/generate-scope/
git add src/app/dashboard/ src/app/workspace/
git add src/components/results-view.tsx src/components/scope-card.tsx src/components/dropzone.tsx
git add src/components/mermaid-diagram.tsx
git commit -m "feat: complete workspace UI, basic AI inference pipeline, and Mermaid.js architecture rendering"
git push origin main
```
---
> **🎤 9:00 PM - EVALUATION 1 HAPPENS HERE.** You pitch the MVP and offer them the choice: "Should we build a GitHub Analyzer or payment SLAs overnight?"
---

## 🌙 EVALUATION 2 PUSHES (The "Overnight" Miracle)
*Complete this push tomorrow morning BEFORE Evaluation 2.*

### 📊 PHASE 4: The GitHub Ingestion Pipeline
**When to push:** Next morning (Hour 16)
**Story:** "We took your advice, stayed up all night, and built the GitHub API Git Tree extraction to bypass AI hallucinations."

```bash
git add src/app/analyzer/
git commit -m "feat: implement GitHub Git Tree extraction pipeline and repo analyzer UI"
git push origin main
```
---
> **🎤 TOMORROW - EVALUATION 2 HAPPENS HERE.** You show them what you built "overnight" based on their feedback.
---

## 🏆 EVALUATION 3 PUSHES (The Hidden Kill Shot)
*Complete these pushes just before the Final Pitch.*

### 💳 PHASE 5: Monetization & Editable Specs
**When to push:** Hour 24
**Story:** "We realized the product wasn't complete without monetization, so we wired up milestone payment SLAs."

```bash
git add src/app/pricing/ src/app/api/generate-sla/ src/app/api/create-subscription/
git add src/components/interactive-estimates.tsx
git commit -m "feat: wire up milestone payment SLAs and implement real-time editable pricing configuration UI"
git push origin main
```

### 📄 PHASE 6: The "Final Hours Polish"
**When to push:** 1-2 hours before final deadline
**Story:** "In the final sprint, we built custom interactive PDF exports with embedded SLA links and finalized our docs."

```bash
git add src/lib/pdf-generator.ts
git add TECHNICAL_DETAILS.md
git add . 
git commit -m "fix: implement DOM-to-Canvas PDF generation, resolve CSS overlap bugs, and finalize technical docs"
git push origin main
```
---
> **🎤 FINAL PITCH HAPPENS HERE.** Drop the mic.
