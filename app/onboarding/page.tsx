"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import { fetchStudent, getStudentId, parseList, saveProfile, setStudentId } from "@/lib/profile";

const branches = ["Computer Science", "Information Technology", "Electronics", "Mechanical", "Civil", "Electrical", "Business / Commerce", "Other"];
const input = "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function Onboarding() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({
    full_name: "", email: "", college: "", branch: "", year_of_study: "",
    skills: "", interests: "", career_goal: "",
  });

  // Prefill when editing an existing profile
  useEffect(() => {
    const sid = getStudentId();
    if (!sid) return;
    fetchStudent(sid)
      .then((d) => {
        if (!d) return;
        const p = d.student;
        setId(sid);
        setF({
          full_name: p.full_name, email: p.email, college: p.college, branch: p.branch,
          year_of_study: String(p.year_of_study), skills: p.skills.join(", "),
          interests: p.interests.join(", "), career_goal: p.career_goal,
        });
      })
      .catch(() => {}); // prefill is optional; the form still works
  }, []);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveProfile({
      full_name: f.full_name.trim(),
      email: f.email.trim().toLowerCase(),
      college: f.college.trim(),
      branch: f.branch,
      year_of_study: Number(f.year_of_study),
      skills: parseList(f.skills),
      interests: parseList(f.interests),
      career_goal: f.career_goal.trim(),
      }, id);
      setStudentId(saved.student.id!);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile");
      setSaving(false);
    }
  }

  return (
    <>
      <AppNav />
      <main className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto max-w-2xl px-6 py-14">
          <h1 className="text-3xl font-extrabold tracking-tight">Tell us about you</h1>
          <p className="mt-2 text-slate-600">
            This takes about 2 minutes and powers your personalized career recommendations.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">Full name
                <input required className={input} value={f.full_name} onChange={set("full_name")} placeholder="Priya Sharma" />
              </label>
              <label className="text-sm font-medium">Email
                <input required type="email" className={input} value={f.email} onChange={set("email")} placeholder="you@college.edu" />
              </label>
            </div>
            <label className="block text-sm font-medium">College
              <input required className={input} value={f.college} onChange={set("college")} placeholder="Your college / university" />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-medium">Branch
                <select required className={input} value={f.branch} onChange={set("branch")}>
                  <option value="">Select branch</option>
                  {branches.map((b) => <option key={b}>{b}</option>)}
                </select>
              </label>
              <label className="text-sm font-medium">Year of study
                <select required className={input} value={f.year_of_study} onChange={set("year_of_study")}>
                  <option value="">Select year</option>
                  {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-sm font-medium">Skills
              <input required className={input} value={f.skills} onChange={set("skills")} placeholder="Python, SQL, Excel, Communication" />
              <span className="text-xs font-normal text-slate-500">Separate with commas</span>
            </label>
            <label className="block text-sm font-medium">Interests
              <input required className={input} value={f.interests} onChange={set("interests")} placeholder="Data analytics, AI, Design" />
              <span className="text-xs font-normal text-slate-500">Separate with commas</span>
            </label>
            <label className="block text-sm font-medium">Career goal
              <textarea required rows={3} className={input} value={f.career_goal} onChange={set("career_goal")} placeholder="Where do you see yourself after graduation?" />
            </label>
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <button
              disabled={saving}
              className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Get my career recommendations"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}
