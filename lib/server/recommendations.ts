import type { SupabaseClient } from "@supabase/supabase-js";
import type { Student } from "../profile";
import { recommend } from "../careers";

/** Generates the top 3 recommendations and saves them (one row per rank, overwritten on re-run). */
export async function saveRecommendations(db: SupabaseClient, studentId: string, s: Student) {
  const generated_at = new Date().toISOString();
  const rows = recommend(s).map((r, i) => ({
    student_id: studentId,
    rank: i + 1,
    career_title: r.title,
    description: r.description,
    outlook: r.outlook,
    score: r.score,
    reason: r.reason,
    missing_skills: r.missing_skills,
    generated_at,
  }));
  const { error } = await db.from("recommendations").upsert(rows, { onConflict: "student_id,rank" });
  if (error) throw error;
  return rows;
}

export async function getRecommendations(db: SupabaseClient, studentId: string) {
  const { data, error } = await db
    .from("recommendations")
    .select("rank, career_title, description, outlook, score, reason, missing_skills")
    .eq("student_id", studentId)
    .order("rank");
  if (error) throw error;
  return data ?? [];
}

/** Returns saved recommendations, generating them first if none exist yet. */
export async function ensureRecommendations(db: SupabaseClient, student: Student & { id: string }) {
  let recs = await getRecommendations(db, student.id);
  if (recs.length === 0) {
    await saveRecommendations(db, student.id, student);
    recs = await getRecommendations(db, student.id);
  }
  return recs;
}
