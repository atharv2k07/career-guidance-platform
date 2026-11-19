import type { ChatMessage } from "./claude";

interface Options {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  timeoutMs?: number;
}

/**
 * Calls the Groq chat-completions API (OpenAI-compatible).
 * Server-only: the key never reaches the browser.
 */
export async function askGroq({
  apiKey,
  model,
  system,
  messages,
  timeoutMs = 25000,
}: Options): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 600,
      messages: [
        { role: "system", content: system },
        ...messages,
      ],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Groq API responded ${res.status}: ${detail}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Groq API returned no text");
  return text;
}
