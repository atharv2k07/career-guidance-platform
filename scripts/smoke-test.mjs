// Real round-trip against your running app + Supabase:
//   npm run dev   (in another terminal, with .env.local filled in)
//   node scripts/smoke-test.mjs            (or BASE_URL=https://... node scripts/smoke-test.mjs)
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const email = `smoke-${Date.now()}@example.com`;

async function api(path, method = "GET", body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}
const step = (m) => console.log("•", m);

const profile = {
  full_name: "Smoke Test", email, college: "Test College", branch: "Computer Science",
  year_of_study: 3, skills: ["Python", "SQL"], interests: ["Data Analytics"], career_goal: "Data analyst",
};

step("rejects invalid input (400)");
assert.equal((await api("/api/students", "POST", { ...profile, email: "bad" })).status, 400);

step("creates student (201) with 3 saved recommendations");
let r = await api("/api/students", "POST", profile);
assert.equal(r.status, 201, JSON.stringify(r.body));
const id = r.body.student.id;
assert.ok(id);
assert.equal(r.body.recommendations.length, 3);

step("rejects duplicate email (409)");
assert.equal((await api("/api/students", "POST", profile)).status, 409);

step("retrieves the same student + recommendations (200)");
r = await api(`/api/students/${id}`);
assert.equal(r.status, 200);
assert.equal(r.body.student.email, email);
assert.deepEqual(r.body.student.skills, ["Python", "SQL"]);
assert.equal(r.body.recommendations.length, 3);

step("updates profile and regenerates recommendations");
r = await api(`/api/students/${id}`, "PUT", { ...profile, skills: ["Figma", "User research"], interests: ["Design"] });
assert.equal(r.status, 200);
assert.deepEqual(r.body.student.skills, ["Figma", "User research"]);
assert.equal(r.body.recommendations.length, 3);

step("unknown student → 404, malformed id → 400");
assert.equal((await api(`/api/students/${crypto.randomUUID()}`)).status, 404);
assert.equal((await api("/api/students/not-a-uuid")).status, 400);

step("saves and retrieves mentor conversation in order");
r = await api(`/api/students/${id}/conversations`, "POST", {
  messages: [{ role: "user", content: "Which career fits me?" }, { role: "assistant", content: "Based on your profile…" }],
});
assert.equal(r.status, 201);
const session = r.body.session_id;
r = await api(`/api/students/${id}/conversations?session_id=${session}`);
assert.equal(r.status, 200);
assert.deepEqual(r.body.messages.map((m) => m.role), ["user", "assistant"]);

step("mentor answers using the saved profile (Claude if a key is set, otherwise demo) and saves it");
r = await api("/api/mentor", "POST", { student_id: id, message: "What skills should I learn first?" });
assert.equal(r.status, 200, JSON.stringify(r.body));
assert.ok(["claude", "demo"].includes(r.body.mode) && r.body.reply.length > 20 && r.body.saved === true);
console.log(`  mentor mode: ${r.body.mode}`);
r = await api(`/api/students/${id}/conversations?session_id=${r.body.session_id}`);
assert.deepEqual(r.body.messages.map((m) => m.role), ["user", "assistant"]);

step("conversation for unknown student → 404");
assert.equal((await api(`/api/students/${crypto.randomUUID()}/conversations`, "POST", { messages: [{ role: "user", content: "x" }] })).status, 404);

console.log(`\nAll smoke tests passed (test student: ${email}).`);
