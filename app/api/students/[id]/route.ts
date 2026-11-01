import { getDb } from "@/lib/server/supabase";
import { badRequest, isUniqueViolation, json, notFound, readJson, serverError } from "@/lib/server/http";
import { getRecommendations, saveRecommendations } from "@/lib/server/recommendations";
import { isUuid, validateStudent } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

// Retrieve a student with their saved recommendations.
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return badRequest(["id must be a UUID"]);

  try {
    const db = getDb();
    const { data: student, error } = await db.from("students").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    if (!student) return notFound();

    let recommendations = await getRecommendations(db, id);
    if (recommendations.length === 0) {
      // Self-heal if recommendations failed to save earlier.
      await saveRecommendations(db, id, student);
      recommendations = await getRecommendations(db, id);
    }
    return json({ student, recommendations });
  } catch (e) {
    return serverError(e);
  }
}

// Update the profile and regenerate recommendations.
export async function PUT(req: Request, { params }: Ctx) {
  const { id } = await params;
  if (!isUuid(id)) return badRequest(["id must be a UUID"]);
  const parsed = validateStudent(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.errors);

  try {
    const db = getDb();
    const { data: student, error } = await db
      .from("students")
      .update(parsed.data)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (isUniqueViolation(error)) return json({ error: "A profile with this email already exists" }, 409);
    if (error) throw error;
    if (!student) return notFound();

    await saveRecommendations(db, id, parsed.data);
    return json({ student, recommendations: await getRecommendations(db, id) });
  } catch (e) {
    return serverError(e);
  }
}
