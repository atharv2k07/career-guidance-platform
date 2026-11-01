// Full user flow through the REAL route handlers: onboarding -> recommendations -> dashboard
// retrieval -> mentor chat (demo, Claude, Claude failure) -> saved conversation history.
// DB is an in-memory fake and Claude is a mocked fetch; see scripts/smoke-test.mjs for the live check.
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "http://fake";
process.env.SUPABASE_SERVICE_ROLE_KEY = "fake-service-key";
delete process.env.ANTHROPIC_API_KEY;

const { tables } = await import("./fake-supabase.mjs");
const students = await import("../app/api/students/route.ts");
const student = await import("../app/api/students/[id]/route.ts");
const convos = await import("../app/api/students/[id]/conversations/route.ts");
const mentor = await import("../app/api/mentor/route.ts");

const call = async (handler, url, method = "GET", body, id) => {
  const req = new Request("http://test" + url, { method, body: body ? JSON.stringify(body) : undefined });
  const res = await handler(req, { params: Promise.resolve({ id }) });
  return { status: res.status, body: await res.json() };
};
const step = (m) => console.log("•", m);

const profile = {
  full_name: "Priya Sharma", email: "priya@example.com", college: "SIT", branch: "Computer Science", year_of_study: 3,
  skills: ["Python", "SQL", "Excel"], interests: ["Data Analytics", "AI"], career_goal: "Become a data scientist",
};

step("mentor reports demo mode when no API key is set");
assert.equal((await call(mentor.GET, "/api/mentor")).body.mode, "demo");

step("onboarding validation rejects bad input");
assert.equal((await call(students.POST, "/api/students", "POST", { ...profile, email: "bad" })).status, 400);

step("onboarding saves profile + 3 recommendations with explanations and missing skills");
let r = await call(students.POST, "/api/students", "POST", profile);
assert.equal(r.status, 201);
const id = r.body.student.id;
assert.equal(r.body.recommendations.length, 3);
for (const rec of r.body.recommendations) {
  assert.ok(rec.reason.length > 20 && Array.isArray(rec.missing_skills) && rec.career_title);
}
assert.equal(tables.recommendations.length, 3);

step("duplicate email -> 409");
assert.equal((await call(students.POST, "/api/students", "POST", profile)).status, 409);

step("dashboard retrieval returns the saved student and recommendations");
r = await call(student.GET, `/api/students/${id}`, "GET", undefined, id);
assert.equal(r.status, 200);
assert.equal(r.body.student.full_name, "Priya Sharma");
assert.deepEqual(r.body.recommendations.map((x) => x.rank), [1, 2, 3]);
const topTitle = r.body.recommendations[0].career_title;
const topMissing = r.body.recommendations[0].missing_skills;

step("mentor (demo mode): personalised reply, labelled demo, saved in order");
r = await call(mentor.POST, "/api/mentor", "POST", { student_id: id, message: "What skills should I learn first?" });
assert.equal(r.status, 200);
assert.equal(r.body.mode, "demo");
assert.equal(r.body.saved, true);
assert.ok(topMissing.length === 0 || r.body.reply.includes(topMissing[0]), "reply mentions a real missing skill");
const session = r.body.session_id;
assert.ok(session);
assert.deepEqual(tables.conversations.map((c) => [c.role, c.source ?? null]), [["user", null], ["assistant", "demo"]]);

step("same session continues; history is retrievable in order");
r = await call(mentor.POST, "/api/mentor", "POST", { student_id: id, session_id: session, message: "Give me a 30-day plan" });
assert.equal(r.body.session_id, session);
r = await call(convos.GET, `/api/students/${id}/conversations?session_id=${session}`, "GET", undefined, id);
assert.deepEqual(r.body.messages.map((m) => m.role), ["user", "assistant", "user", "assistant"]);
assert.equal(r.body.messages[2].content, "Give me a 30-day plan");

// ---- Claude path (mocked API) ----
process.env.ANTHROPIC_API_KEY = "sk-ant-test-secret";
const realFetch = globalThis.fetch;
let claudeCalls = [];
globalThis.fetch = async (url, init) => {
  claudeCalls.push({ url, init, body: JSON.parse(init.body) });
  return new Response(JSON.stringify({ content: [{ type: "text", text: "Great question, Priya! Start with statistics." }] }), { status: 200 });
};

step("mentor reports Claude mode when key is set");
assert.equal((await call(mentor.GET, "/api/mentor")).body.mode, "claude");

step("mentor (Claude): sends saved profile as context + history, saves as source=claude");
tables.conversations.length = 0;
r = await call(mentor.POST, "/api/mentor", "POST", { student_id: id, message: "Which career fits me?" });
assert.equal(r.body.mode, "claude");
assert.equal(r.body.reply, "Great question, Priya! Start with statistics.");
let c = claudeCalls[0];
assert.equal(c.url, "https://api.anthropic.com/v1/messages");
assert.equal(c.init.headers["x-api-key"], "sk-ant-test-secret");
assert.ok(c.body.system.includes("Priya Sharma") && c.body.system.includes("Become a data scientist") && c.body.system.includes(topTitle), "profile + recs in system prompt");
assert.deepEqual(c.body.messages, [{ role: "user", content: "Which career fits me?" }]);
assert.deepEqual(tables.conversations.map((x) => x.source ?? null), [null, "claude"]);

step("follow-up includes prior turns, alternating, ending with the new user message");
r = await call(mentor.POST, "/api/mentor", "POST", { student_id: id, session_id: r.body.session_id, message: "And what projects?" });
c = claudeCalls[1];
assert.deepEqual(c.body.messages.map((m) => m.role), ["user", "assistant", "user"]);
assert.equal(c.body.messages[2].content, "And what projects?");

step("API key is never present in any response");
assert.ok(!JSON.stringify(r.body).includes("sk-ant-test-secret"));

step("Claude failure -> falls back to a labelled demo reply, still saved");
globalThis.fetch = async () => new Response("overloaded", { status: 529 });
const quiet = console.error; console.error = () => {};
r = await call(mentor.POST, "/api/mentor", "POST", { student_id: id, message: "Give me a plan" });
console.error = quiet;
assert.equal(r.status, 200);
assert.equal(r.body.mode, "demo");
assert.ok(r.body.notice && r.body.reply.length > 40);
assert.equal(tables.conversations.at(-1).source, "demo");
globalThis.fetch = realFetch;

step("mentor input validation and unknown student");
assert.equal((await call(mentor.POST, "/api/mentor", "POST", { student_id: id, message: "" })).status, 400);
assert.equal((await call(mentor.POST, "/api/mentor", "POST", { student_id: id, message: "x".repeat(1001) })).status, 400);
assert.equal((await call(mentor.POST, "/api/mentor", "POST", { student_id: "nope", message: "hi" })).status, 400);
assert.equal((await call(mentor.POST, "/api/mentor", "POST", { student_id: crypto.randomUUID(), message: "hi" })).status, 404);

step("editing the profile regenerates recommendations");
r = await call(student.PUT, `/api/students/${id}`, "PUT", { ...profile, skills: ["Figma", "User research", "Prototyping"], interests: ["Design"], career_goal: "UX designer" }, id);
assert.equal(r.status, 200);
assert.equal(r.body.recommendations[0].career_title, "UX Designer");
assert.equal(tables.recommendations.length, 3, "upsert overwrote ranks, no duplicates");

console.log("\nFull user-flow test passed");
