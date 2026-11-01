export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Options {
  apiKey: string;
  model: string;
  system: string;
  messages: ChatMessage[];
  timeoutMs?: number;
}

/** Calls the Claude Messages API. Server-only: the key never reaches the browser. */
export async function askClaude({ apiKey, model, system, messages, timeoutMs = 25000 }: Options): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({ model, max_tokens: 600, system, messages }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const detail = (await res.text().catch(() => "")).slice(0, 300);
    throw new Error(`Claude API responded ${res.status}: ${detail}`);
  }
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (!text) throw new Error("Claude API returned no text");
  return text;
}
