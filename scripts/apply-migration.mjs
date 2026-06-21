#!/usr/bin/env node
// apply-migration.mjs
// Applies the multi-tenant org migration using the Supabase JS client with service role key
// Run with: node apply-migration.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = "https://pciaoxzvdtqipkapcqap.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjaWFveHp2ZHRxaXBrYXBjcWFwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM3MjUwNSwiZXhwIjoyMDg5OTQ4NTA1fQ.wcX05MfrPG-q2Mmp7rvNnEzNgXISJJPuZp2QlRAs2Qs";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// We'll send the SQL statements through the Postgres REST endpoint
// by calling a custom RPC. Since exec_sql may not exist, we use the
// Supabase pg REST endpoint: POST /rest/v1/  with raw SQL via headers

const migrationPath = join(__dirname, "supabase/migrations/20260621_multi_tenant_orgs.sql");
const sql = readFileSync(migrationPath, "utf-8");

// Split into individual statements (split on semicolons that end a statement)
// We'll execute each statement individually via fetch to the pg endpoint
const statements = sql
  .split(/;\s*\n/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0 && !s.startsWith("--"));

console.log(`Found ${statements.length} statements to execute\n`);

let successCount = 0;
let errorCount = 0;

for (let i = 0; i < statements.length; i++) {
  const stmt = statements[i];
  const preview = stmt.slice(0, 80).replace(/\n/g, " ");
  process.stdout.write(`[${i + 1}/${statements.length}] ${preview}... `);

  try {
    // Use the pg REST endpoint (available via service role)
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: "POST",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "params=single-object",
      },
      body: JSON.stringify({ query: stmt + ";" }),
    });

    // If the direct endpoint fails, try rpc approach
    if (!res.ok) {
      const errText = await res.text();
      // Some statements may not be supported via REST — try alternative
      console.log(`⚠ REST endpoint returned ${res.status}: ${errText.slice(0, 100)}`);
      errorCount++;
    } else {
      console.log("✓");
      successCount++;
    }
  } catch (err) {
    console.log(`✗ ${err.message}`);
    errorCount++;
  }
}

console.log(`\nDone: ${successCount} succeeded, ${errorCount} failed`);
console.log("\nNOTE: If errors occurred, please run the migration manually in the Supabase SQL Editor.");
console.log(`Migration file: supabase/migrations/20260621_multi_tenant_orgs.sql`);
