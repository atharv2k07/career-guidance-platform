export interface Student {
  id?: string;
  full_name: string;
  email: string;
  college: string;
  branch: string;
  year_of_study: number;
  skills: string[];
  interests: string[];
  career_goal: string;
}

export interface SavedRecommendation {
  rank: number;
  career_title: string;
  description: string;
  outlook: string;
  score: number;
  reason: string;
  missing_skills: string[];
}

export interface StudentData {
  student: Student;
  recommendations: SavedRecommendation[];
}

// Only the student's ID lives in the browser; all data comes from the API.
const KEY = "pathfinder_student_id";
export const getStudentId = () => localStorage.getItem(KEY);
export const setStudentId = (id: string) => localStorage.setItem(KEY, id);

export const parseList = (v: string) =>
  v.split(",").map((s) => s.trim()).filter(Boolean);

export const sampleProfile: Student = {
  full_name: "Priya Sharma",
  email: "priya.sharma@example.com",
  college: "Sample Institute of Technology",
  branch: "Computer Science",
  year_of_study: 3,
  skills: ["Python", "SQL", "Excel", "Communication"],
  interests: ["Data Analytics", "AI", "Problem Solving"],
  career_goal: "Become a data scientist at a product company",
};

async function call(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

const errorOf = (body: { error?: string; details?: string[] }) =>
  new Error(body.details?.join("; ") || body.error || "Request failed");

/** Returns null if the student no longer exists. */
export async function fetchStudent(id: string): Promise<StudentData | null> {
  const { res, body } = await call(`/api/students/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw errorOf(body);
  return body;
}

/** Creates the profile, or updates it if an id is given. */
export async function saveProfile(s: Student, id?: string | null): Promise<StudentData> {
  if (id) {
    const { res, body } = await call(`/api/students/${id}`, { method: "PUT", body: JSON.stringify(s) });
    if (res.ok) return body;
    if (res.status !== 404) throw errorOf(body); // 404 = row was deleted, fall through and recreate
  }
  const { res, body } = await call("/api/students", { method: "POST", body: JSON.stringify(s) });
  if (!res.ok) throw errorOf(body);
  return body;
}
