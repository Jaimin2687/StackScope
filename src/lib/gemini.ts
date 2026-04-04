import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const SCOPE_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    proposal: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING, description: "Project title" },
        summary: {
          type: SchemaType.STRING,
          description: "2-3 paragraph executive summary",
        },
        objectives: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
          description: "List of key project objectives",
        },
      },
      required: ["title", "summary", "objectives"],
    },
    sprint_timeline: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          sprint: { type: SchemaType.NUMBER, description: "Sprint number" },
          duration: {
            type: SchemaType.STRING,
            description: "Duration e.g. '2 weeks'",
          },
          tasks: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "List of tasks for this sprint",
          },
        },
        required: ["sprint", "duration", "tasks"],
      },
    },
    tech_stack: {
      type: SchemaType.OBJECT,
      properties: {
        frontend: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        backend: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        database: { type: SchemaType.STRING },
        infra: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING },
        },
        detailed_specifications: {
          type: SchemaType.STRING,
          description: "Detailed architectural breakdown of how the tech stack pieces interact, including protocols, events, and caching layers."
        },
      },
      required: ["frontend", "backend", "database", "infra"],
    },
    sql_schema: {
      type: SchemaType.STRING,
      description:
        "Complete PostgreSQL CREATE TABLE statements. MUST include ACID transactions, B-Tree/Hash indexes, row-level security policies, and junction tables.",
    },
    unit_economics: {
      type: SchemaType.OBJECT,
      properties: {
        hosting_costs_per_month: { type: SchemaType.STRING },
        database_costs_per_month: { type: SchemaType.STRING },
        expected_profit_margin: { type: SchemaType.STRING },
        break_even_users: { type: SchemaType.NUMBER },
      },
    },
    detailed_architecture: {
      type: SchemaType.STRING,
      description: "Deep dive into system topology, messaging queues, event buses, and microservice/monorepo boundaries.",
    },
    scalability_plan: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Step-by-step strategy for horizontal/vertical scaling, read replicas, and caching.",
    },
    mermaid_diagram: {
      type: SchemaType.STRING,
      description: "Valid Mermaid.js graph TD string.",
    },
    estimates: {
      type: SchemaType.OBJECT,
      properties: {
        base_cost_inr: { type: SchemaType.NUMBER },
        base_weeks: { type: SchemaType.NUMBER },
        optional_features: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.STRING },
              name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              cost_add_inr: { type: SchemaType.NUMBER },
              weeks_add: { type: SchemaType.NUMBER },
              selected_by_default: { type: SchemaType.BOOLEAN }
            },
            required: ["id", "name", "description", "cost_add_inr", "weeks_add", "selected_by_default"]
          }
        }
      },
      required: ["base_cost_inr", "base_weeks", "optional_features"]
    }
  },
  required: ["proposal", "sprint_timeline", "tech_stack", "sql_schema", "unit_economics", "detailed_architecture", "scalability_plan", "estimates", "mermaid_diagram"],
} as Schema;

function getSystemPrompt(targetLanguage: string, isMigration?: boolean): string {
  let migrationOverrides = isMigration ? `\n\nSTRICT REPO MIGRATION DIRECTIVES:
You are a God-Mode Analyzer and Principal Architect.
CRITICAL RULES:
1. NO GUESSING: Do not use the word "assume" regarding the current codebase. Definitively state the current inferred tech stack based on the injected raw files vs. the target modern stack.
2. SPONSOR LOCK-IN: If real-time features are required, you MUST specify Supabase Realtime definitively. NEVER suggest Redis, Socket.io, or custom WebSockets.
3. EXTRACT DEEP ENTITIES: Read the injected file context to find domain-specific entities. Do not default to generic 'User' and 'Project/Load'.
4. NO SUMMARIES FOR SECURITY: Under Security Notes (or RLS), you MUST output the literal, raw PostgreSQL 'CREATE POLICY' syntax required to isolate tenant data. If you output a summary sentence instead of SQL code, you have failed.
5. MANDATORY MODERNIZATION: The entire point is to migrate their current architecture. The Frontend MUST be Next.js. The Database and Auth MUST be Supabase Postgres. However, for the BACKEND technology, you MUST analyze their current legacy code and recommend the ABSOLUTE BEST modern backend framework fitting their logic (e.g., Python/FastAPI for AI/data logic, Go for high-concurrency, Node/Express for TS full-stack, etc.). Mention this precise architectural transition explicitly in the proposal summary.` : '';

  // Require explicit CRUD RLS policies per table when performing migrations.
  if (isMigration && migrationOverrides) {
    migrationOverrides += `\n\nMANDATORY CRUD RLS REQUIREMENT:\nFor every table generated, include explicit CREATE POLICY statements for SELECT, INSERT, UPDATE, and DELETE. Use Supabase's auth.uid() for owner/tenant checks where appropriate. Missing CRUD policies is considered an invalid result.`;
  }

  return `You are a Principal Solutions Architect at a top-tier software agency.
Your job is to listen to messy, unstructured, and often vague client briefs (including audio transcripts) and instantly architect a production-ready, scalable Micro-SaaS or enterprise system.

CRITICAL DIRECTIVES:
1. NEVER REJECT AN INPUT. If the brief is vague, rambling, or incomplete, DO NOT ask for more details. Use your expertise to make aggressive, industry-standard assumptions and fill in the blanks to create a complete, logical system.
2. DECOUPLED TECH STACK: You MUST strictly enforce a decoupled architecture. The Frontend MUST be Next.js/React. The Database, Authentication, and Storage MUST be Supabase (PostgreSQL). For the Backend API Gateway / Microservices, dynamically recommend the absolute best technology (e.g., Python/FastAPI, Go, Rust, Node.js/Express, Spring Boot) based on their specific logic/requirements. Never suggest alternative databases like MongoDB or MySQL.
3. Produce professional, implementation-ready detail. Avoid hand-wavy suggestions.
4. DATABASE SCHEMA AND DEEP ARCHITECTURE: You MUST output raw, deployable PostgreSQL CREATE TABLE statements optimized specifically for Supabase AND complete details on Unit Economics, Detailed Architecture, Scalability, and technical specs.
- UNIT ECONOMICS & SCALABILITY: Always compute estimated hosting costs in INR (₹) per month, break-even thresholds, detailed architecture including queues and cache, and step-by-step zero-to-million user scaling strategies. ALL unit economics and prices MUST be deeply aligned with the current Indian market and be highly feasible and realistic. Project estimates (base_cost_inr, optional_features) must reflect typical agency rates in India for a production-grade product, starting at realistic market values in INR.\n- ARCHITECTURE DIAGRAM: The Mermaid.js diagram MUST be exceptionally detailed, mapped to the true system architecture, showing all microservices, databases, queues, caches, and CDN layers.
This includes:
   - PRIMARY KEYS & AUTH: Use UUID generated by uuid_generate_v4() for all primary keys. Any user table MUST reference Supabase's native auth.users table.
   - SECURITY (RLS): Every single table created MUST include 'ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;' followed by the exact CREATE POLICY statements required to isolate tenant data.
   - FULL RELATIONAL NORMALIZATION (3NF): EVERY table MUST have proper primary/foreign key connections. Do NOT leave tables disconnected. DO NOT use plain string fields when it should be a foreign key.
   - TWO-PASS SCHEMA GENERATION: First CREATE ALL TABLES without inline foreign keys. Then, at the end of the script, use ALTER TABLE statements to add all foreign key constraints. This prevents "relation does not exist" errors.
5. Your entire response MUST be a valid JSON object that matches the provided response schema exactly.
6. Do NOT include Markdown, code fences, or extra commentary outside the JSON.
${migrationOverrides}

INSTRUCTIONS:
1. Analyze the provided project brief (text or transcribed audio).
2. Generate a comprehensive technical scope document.
3. All output text MUST be in the language: ${targetLanguage}.
4. Be specific and practical — no vague recommendations.
5. The SQL schema should be production-ready PostgreSQL with proper types, constraints, and indexes.
6. Sprint timelines should be realistic for a small-to-medium development team (2-5 developers).
7. Tech stack recommendations should be modern, well-supported, and appropriate for the project scale.

QUALITY STANDARDS:
- Proposals should be 2-3 detailed paragraphs minimum.
- Include at least 4-6 clear objectives.
- Plan for 3-6 sprints depending on project complexity.
- SQL schemas should include at least 3-5 tables with proper relationships.
- Always include user authentication tables if the project involves users.`;
}

export async function generateScope(
  input: string | { data: string; mimeType: string },
  targetLanguage: string,
  isMigration?: boolean
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: SCOPE_RESPONSE_SCHEMA,
    },
    systemInstruction: getSystemPrompt(targetLanguage, isMigration),
  });

  const parts: Array<string | { inlineData: { data: string; mimeType: string } }> = [];

  if (typeof input === "string") {
    parts.push(
      `Analyze the following project brief and generate a complete technical scope:\n\n${input}`
    );
  } else {
    parts.push(
      "Analyze the following audio recording of a project brief. First, mentally transcribe it. Then infer missing context and generate a complete technical scope. The output MUST be valid JSON matching the schema."
    );
    parts.push({
      inlineData: {
        data: input.data,
        mimeType: input.mimeType,
      },
    });
  }

  try {
    const result = await model.generateContent(parts);
    const response = result.response;
    return response.text();
  } catch (err: any) {
    // Handle quota/rate limit with a single retry (Gemini often returns RetryInfo ~59s).
    const status = err?.status;
    const retryDelayRaw = err?.errorDetails?.find?.((d: any) => d?.retryDelay)?.retryDelay;
    const retrySeconds = typeof retryDelayRaw === "string" && retryDelayRaw.endsWith("s")
      ? Number(retryDelayRaw.slice(0, -1))
      : NaN;

    if (status === 429) {
      const delayMs = Number.isFinite(retrySeconds)
        ? Math.min(Math.max(1000, retrySeconds * 1000), 15_000) // cap at 15s so API doesn't hang forever
        : 5_000;
      await new Promise((r) => setTimeout(r, delayMs));

      // Retry once
      const result = await model.generateContent(parts);
      const response = result.response;
      return response.text();
    }

    throw err;
  }
}
