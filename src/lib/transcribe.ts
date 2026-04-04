import Groq from "groq-sdk";

/**
 * Transcribe an audio File using Groq Whisper.
 *
 * Requires GROQ_API_KEY in the environment.
 */
export async function transcribeAudioWithGroq(file: File): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  // Groq SDK expects a Web/File-like object; in Next.js Route Handlers (Node runtime)
  // File is available from formData() and can be passed through.
  const groq = new Groq({ apiKey });

  const result = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3",
    response_format: "json",
    temperature: 0,
  } as any);

  // groq-sdk typings vary by version; result is typically { text: string }
  const text = (result as any)?.text;
  return typeof text === "string" ? text.trim() : "";
}
