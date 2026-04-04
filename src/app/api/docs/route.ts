import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

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
