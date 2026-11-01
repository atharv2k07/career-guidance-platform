import { getDb } from "@/lib/server/supabase";
import { badRequest, isUniqueViolation, json, readJson, serverError } from "@/lib/server/http";
import { saveRecommendations, getRecommendations } from "@/lib/server/recommendations";
import { validateStudent } from "@/lib/validation";

// Create a student profile (onboarding) and generate + save their recommendations.
export async function POST(req: Request) {
  const parsed = validateStudent(await readJson(req));
  if (!parsed.ok) return badRequest(parsed.errors);

  try {
    const db = getDb();
    const { data: student, error } = await db.from("students").insert(parsed.data).select().single();
    if (isUniqueViolation(error)) {
      return json({ error: "A profile with this email already exists" }, 409);
    }
    if (error) throw error;

    let recommendations: Awaited<ReturnType<typeof getRecommendations>> = [];
    try {
      await saveRecommendations(db, student.id, parsed.data);
      recommendations = await getRecommendations(db, student.id);
    } catch (e) {
      console.error("[api] saving recommendations failed (GET will retry):", e);
    }
    return json({ student, recommendations }, 201);
  } catch (e) {
    return serverError(e);
  }
}
