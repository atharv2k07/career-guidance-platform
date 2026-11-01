import { getDb } from "@/lib/server/supabase";
import { askClaude, type ChatMessage } from "@/lib/server/claude";
import { ensureRecommendations } from "@/lib/server/recommendations";
import { badRequest, json, notFound, readJson, serverError } from "@/lib/server/http";
import { buildSystemPrompt, demoReply } from "@/lib/mentor";
import { validateMentorRequest } from "@/lib/validation";

// Allow time for the Claude call (our own timeout is 25s) on serverless hosts.
export const maxDuration = 30;

const MODEL = () => process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

// Tells the UI which mode it is in, without revealing anything about the key.
export async function GET() {
  return json({ mode: process.env.ANTHROPIC_API_KEY ? "claude" : "demo" });
}

export async function POST(req: Request) {
  const parsed = validateMentorRequest(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.errors);
  const { student_id, message } = parsed.data;
  const session_id = parsed.data.session_id ?? crypto.randomUUID();

  try {
    const db = getDb();

    // Context always comes from the saved profile in the database, never from the client.
    const { data: student, error } = await db.from("students").select("*").eq("id", student_id).maybeSingle();
    if (error) throw error;
    if (!student) return notFound();
    const recs = await ensureRecommendations(db, student);

    // Recent turns of this conversation (oldest first, must start with the user).
    const { data: past, error: histErr } = await db
      .from("conversations")
      .select("role, content")
      .eq("student_id", student_id)
      .eq("session_id", session_id)
      .order("seq", { ascending: false })
      .limit(10);
    if (histErr) throw histErr;
    const history = ((past ?? []).reverse() as ChatMessage[]).filter((_, i, a) => a.slice(0, i + 1).some((m) => m.role === "user"));

    let reply = "";
    let source: "claude" | "demo" = "demo";
    let notice: string | undefined;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      try {
        reply = await askClaude({
          apiKey,
          model: MODEL(),
          system: buildSystemPrompt(student, recs),
          messages: [...history, { role: "user", content: message }],
        });
        source = "claude";
      } catch (e) {
        console.error("[mentor] Claude call failed, using demo reply:", e);
        notice = "Claude is temporarily unavailable, so this is a demo reply.";
      }
    }
    if (!reply) reply = demoReply(student, recs, message);

    // Save the exchange. A failure here must not lose the answer the student is waiting for.
    const { error: saveErr } = await db.from("conversations").insert([
      { student_id, session_id, role: "user", content: message },
      { student_id, session_id, role: "assistant", content: reply, source },
    ]);
    if (saveErr) console.error("[mentor] saving conversation failed:", saveErr);

    return json({ reply, mode: source, session_id, saved: !saveErr, notice });
  } catch (e) {
    return serverError(e);
  }
}
