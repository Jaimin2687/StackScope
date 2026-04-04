import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

export const SCOPE_RESPONSE_SCHEMA = {
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
    estimates: {
      type: SchemaType.OBJECT,
      properties: {
        total_weeks: { type: SchemaType.NUMBER },
        dev_days: { type: SchemaType.NUMBER },
        team_size: { type: SchemaType.NUMBER },
        cost_estimate: { type: SchemaType.STRING }
      },
      required: ["total_weeks", "dev_days", "team_size", "cost_estimate"]
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
      },
      required: ["frontend", "backend", "database", "infra"],
    },
    sql_schema: {
      type: SchemaType.STRING,
      description:
        "Complete PostgreSQL CREATE TABLE statements for the project",
    },
    security: {
      type: SchemaType.OBJECT,
      properties: {
        rls_notes: { type: SchemaType.STRING, description: "CRITICAL: You MUST output raw PostgreSQL CREATE POLICY statements here. Absolutely NO English summaries or explanations. ONLY valid SQL syntax." },
        auth_flow: { type: SchemaType.STRING },
        encryption_at_rest: { type: SchemaType.STRING },
        rate_limiting: { type: SchemaType.STRING }
      },
      required: ["rls_notes", "auth_flow", "encryption_at_rest", "rate_limiting"]
    },
    api_endpoints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          path: { type: SchemaType.STRING },
          method: { type: SchemaType.STRING },
          auth_required: { type: SchemaType.BOOLEAN },
          request_schema_summary: { type: SchemaType.STRING },
          response_schema_summary: { type: SchemaType.STRING }
        },
        required: ["path", "method", "auth_required", "request_schema_summary", "response_schema_summary"]
      }
    },
    data_model_summary: {
      type: SchemaType.OBJECT,
      properties: {
        entities: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING },
              description: { type: SchemaType.STRING },
              key_fields: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["name", "description", "key_fields"]
          }
        },
        relationships: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
      },
      required: ["entities", "relationships"]
    }
  },
  required: ["proposal", "sprint_timeline", "tech_stack", "sql_schema", "security", "api_endpoints", "data_model_summary", "estimates"],
} as Schema;
