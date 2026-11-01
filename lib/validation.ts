import type { Student } from "./profile";

export type Result<T> = { ok: true; data: T } | { ok: false; errors: string[] };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

function text(v: unknown, name: string, max: number, errors: string[]): string {
  if (typeof v !== "string" || !v.trim()) {
    errors.push(`${name} is required`);
    return "";
  }
  const s = v.trim();
  if (s.length > max) errors.push(`${name} must be at most ${max} characters`);
  return s;
}

function list(v: unknown, name: string, errors: string[]): string[] {
  if (!Array.isArray(v) || v.length === 0) {
    errors.push(`${name} must be a non-empty list`);
    return [];
  }
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of v) {
    if (typeof item !== "string") {
      errors.push(`${name} must contain only text`);
      return [];
    }
    const s = item.trim();
    if (!s || seen.has(s.toLowerCase())) continue;
    if (s.length > 40) errors.push(`Each item in ${name} must be at most 40 characters`);
    seen.add(s.toLowerCase());
    out.push(s);
  }
  if (out.length === 0) errors.push(`${name} must be a non-empty list`);
  if (out.length > 20) errors.push(`${name} can have at most 20 items`);
  return out;
}

export function validateStudent(body: unknown): Result<Student> {
  if (typeof body !== "object" || body === null) return { ok: false, errors: ["Body must be a JSON object"] };
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  const email = text(b.email, "email", 254, errors).toLowerCase();
  if (email && !EMAIL.test(email)) errors.push("email is not a valid address");

  const year = b.year_of_study;
  if (!Number.isInteger(year) || (year as number) < 1 || (year as number) > 5) {
    errors.push("year_of_study must be a whole number from 1 to 5");
  }

  const data: Student = {
    full_name: text(b.full_name, "full_name", 100, errors),
    email,
    college: text(b.college, "college", 150, errors),
    branch: text(b.branch, "branch", 80, errors),
    year_of_study: year as number,
    skills: list(b.skills, "skills", errors),
    interests: list(b.interests, "interests", errors),
    career_goal: text(b.career_goal, "career_goal", 500, errors),
  };
  return errors.length ? { ok: false, errors } : { ok: true, data };
}

export interface MessageInput {
  role: "user" | "assistant";
  content: string;
}

export function validateMessages(body: unknown): Result<{ session_id: string; messages: MessageInput[] }> {
  if (typeof body !== "object" || body === null) return { ok: false, errors: ["Body must be a JSON object"] };
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  let session_id = "";
  if (b.session_id === undefined) session_id = crypto.randomUUID();
  else if (isUuid(b.session_id)) session_id = b.session_id;
  else errors.push("session_id must be a UUID");

  const raw = b.messages;
  const messages: MessageInput[] = [];
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 20) {
    errors.push("messages must be a list of 1 to 20 items");
  } else {
    raw.forEach((m, i) => {
      const r = (m ?? {}) as Record<string, unknown>;
      if (r.role !== "user" && r.role !== "assistant") errors.push(`messages[${i}].role must be "user" or "assistant"`);
      const content = text(r.content, `messages[${i}].content`, 4000, errors);
      if (r.role === "user" || r.role === "assistant") messages.push({ role: r.role, content });
    });
  }
  return errors.length ? { ok: false, errors } : { ok: true, data: { session_id, messages } };
}

export function validateMentorRequest(
  body: unknown
): Result<{ student_id: string; message: string; session_id?: string }> {
  if (typeof body !== "object" || body === null) return { ok: false, errors: ["Body must be a JSON object"] };
  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isUuid(b.student_id)) errors.push("student_id must be a UUID");
  if (b.session_id !== undefined && !isUuid(b.session_id)) errors.push("session_id must be a UUID");
  const message = text(b.message, "message", 1000, errors);

  return errors.length
    ? { ok: false, errors }
    : { ok: true, data: { student_id: b.student_id as string, message, session_id: b.session_id as string | undefined } };
}
