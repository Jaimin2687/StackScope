import { NextResponse } from "next/server";
import fs from 'fs/promises';
import path from 'path';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

const DOC_PATH = path.join(process.cwd(), 'TECHNICAL_DETAILS.md');

export async function GET() {
  try {
    const content = await fs.readFile(DOC_PATH, 'utf-8');
    return NextResponse.json({ content });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!isJsonRequest(request)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(request);
    const limiter = rateLimit({ key: `docs-write:${ip}`, limit: 5, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return cookieStore.getAll(); } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const content: string = body.content ?? '';
    // Basic validation
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'Content must be a string' }, { status: 400 });
    }

    await fs.writeFile(DOC_PATH, content, 'utf-8');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}
