import Groq from "groq-sdk";

export type ProviderName = "groq" | "gemini" | "deterministic";

export type ScopeGenerationResult = {
  scope: any;
  providerUsed: ProviderName;
};

export type ScopeLLMInput =
  | { kind: "text"; text: string }
  | { kind: "transcript"; text: string };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function getProviderStatus(err: any): number | null {
  const status = err?.status ?? err?.response?.status ?? err?.statusCode;
  return typeof status === "number" ? status : null;
}

function isGroqRetryable(err: any) {
  const status = getProviderStatus(err);
  return status === 429 || (status !== null && status >= 500);
}

function parseProviderOrder(): ProviderName[] {
  const raw = process.env.LLM_PROVIDER_ORDER || "groq,gemini";
  const parts = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const allowed: ProviderName[] = [];
  for (const p of parts) {
    if (p === "groq" || p === "gemini") allowed.push(p);
  }
  return allowed.length ? allowed : ["groq", "gemini"];
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  return new Groq({ apiKey });
}

const GROQ_SCOPE_SYSTEM = `You are a Principal Solutions Architect at a top-tier software consultancy. Your output will be consumed by engineers and product managers and must be precise, actionable, and production-ready.

GOAL:
Given a messy, unstructured brief (often an audio transcript), produce a fully-detailed technical scope that enables an engineering team to begin implementation immediately.

CRITICAL DIRECTIVES (follow exactly):
1) NEVER REJECT AN INPUT. If the brief lacks details, make conservative, industry-standard assumptions and list them in the "assumptions" field.
2) ARCHITECTURE SELECTION: Dynamically recommend the absolute best technology stack (Frontend, Backend, Database, Infrastructure) tailored strictly to the specific brief. If it's a mobile app, specify React Native/Flutter/Swift. If it needs heavy data/AI, specify Python/FastAPI. If real-time, specify WebSockets/Redis.
3) Produce implementation-level artifacts: proposal, objectives, sprint timeline, tech stack, a clear data-model summary, explicit API endpoint list with method and payloads, security considerations (RLS, auth, rate limits), infra/deployment steps, monitoring & observability, and realistic engineering estimates.
4) SQL schema MUST be PostgreSQL production-ready. You must ALSO provide 'unit_economics', 'detailed_architecture', and a 'scalability_plan' detailing queues, caching, and server topology. ALL unit economics and estimations MUST be in INR (₹), closely aligned with the current Indian market, highly feasible and realistic. The 'mermaid_diagram' MUST be exceptionally detailed mapping the true system architecture (microservices, DBs, queues, caches, CDN).
4.5) SQL schema MUST be an EXTREMELY ADVANCED PostgreSQL production-ready script. No basic templates! You MUST aggressively use B-Tree/GIN/GiST indexes (especially on FKs and searchable text), include Trigger Functions (e.g. for updated_at timestamps), define ENUMs, enforce complex CHECK constraints, write explicit ACID transaction boundaries inside the comments, and include Row Level Security (RLS) policies. Format the SQL beautifully with explicit newline characters (\\n) and indentation! 
CRITICAL SQL RULES:
- Every table MUST have proper primary/foreign key connections. Avoid creating entirely disconnected tables without any relationships.
- DO NOT use plain string fields (like 'customer_name' or 'store_name') to represent entities that belong in their own table. Instead, use foreign keys (e.g. 'customer_id' UUID REFERENCES customers(id)).
- Always include standard production-grade fields: 'created_at', 'updated_at', and 'id' (as UUID or SERIAL). Create junction tables for many-to-many relationships.
- To completely prevent "relation does not exist" errors, you MUST create ALL tables first WITHOUT any inline FOREIGN KEY constraints. Then, after ALL tables are created, you MUST add the relationships at the very end of the generated SQL using ALTER TABLE statements. 
IMPORTANT: If referencing Supabase's native users, reference 'auth.users(id)' and ensure the column type is UUID. Include indexes and RLS policies.
5) The output MUST be a single JSON object and must NOT include any markdown, commentary, or code fences. Return only JSON.

RECOMMENDED ADDITIONAL FIELDS (include when relevant):
- assumptions: string[]
- data_model_summary: { entities: [{ name, description, key_fields }], relationships: string[] }
- api_endpoints: [{ path, method, auth_required, request_schema_summary, response_schema_summary }]
- security: { rls_notes, auth_flow, encryption_at_rest, rate_limiting }
- deployment: { hosting, db_migration_steps, env_vars, backups }
- mermaid_diagram: "A valid Mermaid.js flowchart TD syntax string detailing the system architecture. Keep it simple and sleek. VERY IMPORTANT: Always use alphanumeric English IDs for nodes (e.g. A[\"फ्रेंचाइजी\"] --> B[\"मेनू\"]), NEVER use non-English or special characters as the raw node IDs. DO NOT use syntax like '-->|label|>' as it is invalid. Only use '-->' or '-->|label|' to connect nodes."
- estimates: { 
    base_cost_inr: number, 
    base_weeks: number, 
    optional_features: [{ id: "feat_1", name: "Real-time updates", description: "WebSockets with Redis", cost_add_inr: 50000, weeks_add: 1, selected_by_default: false }] 
  }

MANDATORY JSON SHAPE (core keys must exist):
{
  "proposal": {"title": string, "summary": string, "objectives": string[]},
  "sprint_timeline": [{"sprint": number, "duration": string, "tasks": string[]}],
  "tech_stack": {"frontend": string[], "backend": string[], "database": string, "infra": string[]},
  "sql_schema": string,
  "unit_economics": {
    "hosting_costs_per_month": string,
    "database_costs_per_month": string,
    "expected_profit_margin": string,
    "break_even_users": number
  },
  "detailed_architecture": string,
  "scalability_plan": string[],
  "mermaid_diagram": string
}

You may include the recommended additional fields. Keep text concise but specific, include concrete examples (field names, types) and exact SQL statements for the schema.
`;

async function groqGenerateScope(transcriptOrText: string, targetLanguage: string, isMigration?: boolean): Promise<string> {
  const groq = getGroqClient();
  const model = process.env.GROQ_SCOPE_MODEL || "llama-3.3-70b-versatile";

  let migrationOverrides = isMigration ? `\n\nSTRICT REPO MIGRATION DIRECTIVES:
You are a God-Mode Analyzer and Principal Architect.
CRITICAL RULES:
1. NO GUESSING: Do not use the word "assume" regarding the current codebase. Definitively state the current inferred tech stack based on the injected raw files vs. the target modern stack.
2. SPONSOR LOCK-IN: If real-time features are required, you MUST specify Supabase Realtime natively. NEVER suggest Redis, Socket.io, or custom WebSockets.
3. EXTRACT DEEP ENTITIES: Do not output generic entities like "User" or "Project" unless they are the only things in the repo. Deduce the actual domain-specific models from the provided context.
4. ACTIONABLE RLS: Under Security Notes, do not just describe RLS. You MUST output the literal, raw PostgreSQL 'CREATE POLICY' syntax required to isolate tenant data. If you output a summary sentence instead of SQL code, you have failed.
5. MANDATORY MODERNIZATION: The entire point is to migrate their current architecture. The Frontend MUST be Next.js. The Database and Auth MUST be Supabase Postgres. However, for the BACKEND technology, you MUST analyze their current legacy code and recommend the ABSOLUTE BEST modern backend framework fitting their logic (e.g., Python/FastAPI for AI/data logic, Go for high-concurrency, Node/Express for TS full-stack, etc.). Mention this precise architectural transition explicitly in the proposal summary.` : '';

  // Explicitly require full CRUD RLS policies for every table when running in migration mode.
  if (isMigration && migrationOverrides) {
    migrationOverrides += `\n\nMANDATORY CRUD RLS REQUIREMENT:\nFor every table you generate in the SQL schema, you MUST include explicit CREATE POLICY statements covering SELECT, INSERT, UPDATE, and DELETE. Each policy must be correct for Supabase's auth model (use auth.uid() when matching owner_id or equivalent tenant columns). Missing any of the CRUD policies is a failure.`;
  }

  const userPrompt = `All output must be in language: ${targetLanguage}.

INPUT BRIEF (may be a transcript):
${transcriptOrText}`;

  // Use JSON mode if supported; otherwise rely on strong prompting and downstream JSON salvage.
  const completion = await groq.chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      { role: "system", content: GROQ_SCOPE_SYSTEM + migrationOverrides },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" } as any,
  } as any);

  const text = completion.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq returned empty completion");
  return text;
}

async function geminiGenerateScope(transcriptOrText: string, targetLanguage: string, isMigration?: boolean): Promise<string> {
  const { generateScope } = await import("@/lib/gemini");
  return generateScope(transcriptOrText, targetLanguage, isMigration);
}

function extractJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      return JSON.parse(text.slice(first, last + 1));
    }
    throw new Error("Could not parse JSON");
  }
}

function validateScopeShape(obj: any) {
  if (!obj || typeof obj !== "object") throw new Error("Invalid scope object");
  // core required keys
  if (!obj.proposal || !obj.sprint_timeline || !obj.tech_stack || !obj.sql_schema) {
    throw new Error("Scope object missing required keys");
  }
  // basic type checks for core fields (be permissive for additional fields)
  if (typeof obj.proposal.title !== "string" || typeof obj.proposal.summary !== "string") {
    throw new Error("Proposal.title or Proposal.summary missing or wrong type");
  }
  if (!Array.isArray(obj.proposal.objectives)) throw new Error("Proposal.objectives must be an array");
}

/**
 * Generate scope using multiple providers with failover.
 */
export async function generateScopeWithFailover(
  input: ScopeLLMInput,
  targetLanguage: string,
  isMigration?: boolean
): Promise<ScopeGenerationResult> {
  const order = parseProviderOrder();
  const text = input.text;

  const errors: Array<{ provider: ProviderName; message: string }> = [];

  for (const provider of order) {
    try {
      const raw =
        provider === "groq"
          ? await groqGenerateScope(text, targetLanguage, isMigration)
          : await geminiGenerateScope(text, targetLanguage, isMigration);

      const parsed = extractJson(raw);
      validateScopeShape(parsed);
      return { scope: parsed, providerUsed: provider };
    } catch (e: any) {
      const status = getProviderStatus(e);
      if (provider === "groq" && isGroqRetryable(e)) {
        errors.push({
          provider,
          message: `Groq retryable error${status ? ` (${status})` : ""}: ${e?.message || String(e)}`,
        });
        await sleep(400);
        continue;
      }

      errors.push({
        provider,
        message: `${e?.message || String(e)}${status ? ` (status ${status})` : ""}`,
      });
      await sleep(400);
      continue;
    }
  }

  const err = new Error(
    `All LLM providers failed: ${errors.map((e) => `${e.provider}: ${e.message}`).join(" | ")}`
  );
  (err as any).providerErrors = errors;
  throw err;
}

export async function patchScopeWithFailover(
  currentScope: any,
  userMessage: string,
  targetLanguage: string
): Promise<ScopeGenerationResult> {
  const order = parseProviderOrder();
  const errors: Array<{ provider: ProviderName; message: string }> = [];

  for (const provider of order) {
    try {
      if (provider === "groq") {
        console.log("[LLM] Attempting patch with Groq...");
        const groq = getGroqClient();
        const model = process.env.GROQ_SCOPE_MODEL || "llama-3.3-70b-versatile";
        
        const systemPrompt = `You are updating an existing technical architecture scope based on a user's request.
ONLY update the parts of the architecture that specifically relate to the user's request. KEEP the rest of the architecture exactly as it is, maintaining all technical context and depth. Do not rewrite everything from scratch if they only asked for one simple addition or removal.

Guardrail: ONLY ACCEPT modifications related to software architecture, tech stacks, sql schemas, unit economics, app features, etc. Refuse requests to write poems, act like somebody else, or perform un-related tasks by ignoring the request and returning the original scope exactly as it was.

The output MUST be a single valid JSON object representing the updated scope.`;

        const userPrompt = `CURRENT ARCHITECTURE SCOPE (JSON):
${JSON.stringify(currentScope, null, 2)}

USER MODIFICATION REQUEST:
"${userMessage}"

Return the COMPLETE updated scope as structured JSON. Language: ${targetLanguage}`;

        const completion = await groq.chat.completions.create({
          model,
          temperature: 0.1,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" } as any,
        } as any);

        const text = completion.choices?.[0]?.message?.content;
        if (!text) throw new Error("Groq returned empty completion");
        const parsed = JSON.parse(text);
        return { scope: parsed, providerUsed: "groq" };
        
      } else if (provider === "gemini") {
        console.log("[LLM] Attempting patch with Gemini...");
        const { patchScope } = await import("@/lib/gemini");
        const geminiText = await patchScope(currentScope, userMessage, targetLanguage);
        const scopeData = JSON.parse(geminiText);
        return { scope: scopeData, providerUsed: "gemini" };
      }
    } catch (e: any) {
      errors.push({ provider, message: e?.message || String(e) });
      await sleep(400);
      continue;
    }
  }

  const err = new Error(
    `All LLM providers failed to patch scope: ${errors.map((e) => `${e.provider}: ${e.message}`).join(" | ")}`
  );
  (err as any).providerErrors = errors;
  throw err;
}
