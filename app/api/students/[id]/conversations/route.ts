import { getDb } from "@/lib/server/supabase";
import { badRequest, isForeignKeyViolation, json, notFound, readJson, serverError } from "@/lib/server/http";
import { isUuid, validateMessages } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Save one or more mentor chat messages (e.g. the user's question + the AI reply).
export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return badRequest(["id must be a UUID"]);
  const parsed = validateMessages(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.errors);

  try {
    const { session_id, messages } = parsed.data;
    const rows = messages.map((m) => ({ student_id: id, session_id, role: m.role, content: m.content }));
    const { error } = await getDb().from("conversations").insert(rows);
    if (isForeignKeyViolation(error)) return notFound();
    if (error) throw error;
    return json({ session_id, saved: rows.length }, 201);
  } catch (e) {
    return serverError(e);
  }
}

// Retrieve messages in order. Optional ?session_id= filters to one conversation.
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return badRequest(["id must be a UUID"]);
  const session = new URL(req.url).searchParams.get("session_id");
  if (session !== null && !isUuid(session)) return badRequest(["session_id must be a UUID"]);

  try {
    let q = getDb()
      .from("conversations")
      .select("session_id, role, content, source, created_at, seq")
      .eq("student_id", id);
    if (session) q = q.eq("session_id", session);
    const { data, error } = await q.order("seq", { ascending: false }).limit(200);
    if (error) throw error;
    return json({ messages: (data ?? []).reverse() });
  } catch (e) {
    return serverError(e);
  }
}
