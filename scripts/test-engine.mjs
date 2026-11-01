// Offline tests for the recommendation engine, demo mentor and Claude client.
import assert from "node:assert/strict";
import { recommend, skillSuggestions, getCareer } from "../lib/careers.ts";
import { buildSystemPrompt, demoReply } from "../lib/mentor.ts";
import { askClaude } from "../lib/server/claude.ts";

const priya = {
  full_name: "Priya Sharma", email: "p@x.com", college: "SIT", branch: "Computer Science", year_of_study: 3,
  skills: ["Python", "SQL", "Excel", "Communication"], interests: ["Data Analytics", "AI"], career_goal: "Become a data scientist",
};

// --- engine ---
let recs = recommend(priya);
assert.equal(recs.length, 3);
assert.ok(recs.every((r) => r.reason && Array.isArray(r.missing_skills) && r.score <= 98));
assert.ok(recs.map((r) => r.title).includes("Data Scientist"), "goal 'data scientist' is reflected");
assert.ok(recs.map((r) => r.title).includes("Data Analyst"), "skills drive Data Analyst");
const ds = recs.find((r) => r.title === "Data Scientist");
assert.ok(ds.missing_skills.includes("statistics") && !ds.missing_skills.includes("python"), "missing skills exclude owned ones");
assert.ok(recs[0].score >= recs[1].score && recs[1].score >= recs[2].score, "sorted by score");
assert.ok(ds.reason.includes("python"), "reason names matching skills");

const mech = recommend({ ...priya, branch: "Mechanical", skills: ["SolidWorks", "CAD"], interests: ["Robotics"], career_goal: "Work in robotics" });
assert.equal(mech[0].title, "Mechanical Design Engineer", "non-CS students get relevant careers");

const alias = recommend({ ...priya, skills: ["JS", "React.js", "Node.js", "Git", "SQL"], interests: ["Web"], career_goal: "developer" });
assert.equal(alias[0].title, "Full-Stack Developer", "aliases (JS, Node.js) understood");
assert.equal(alias[0].missing_skills.length, 0);

const cOnly = recommend({ ...priya, skills: ["C"], interests: ["x"], career_goal: "x", branch: "Other" });
assert.ok(!cOnly.some((r) => r.title === "Cloud / DevOps Engineer" && r.score > 50), "single-letter skill does not match everything");
assert.equal(recommend({ ...priya, skills: ["zzz"], interests: ["zzz"], career_goal: "zzz" }).length, 3, "always returns 3, even with no overlap");
assert.ok(skillSuggestions(priya, getCareer("Data Scientist")).every((x) => x.tip));

// --- demo mentor ---
const saved = recs.map((r, i) => ({ rank: i + 1, career_title: r.title, description: r.description, outlook: r.outlook, score: r.score, reason: r.reason, missing_skills: r.missing_skills }));
for (const q of ["what skills should I learn", "give me a 30 day plan", "what projects should I build", "why do these fit me", "internship tips", "what about salary", "hello", "tell me about UX Designer"]) {
  const r = demoReply(priya, saved, q);
  assert.ok(typeof r === "string" && r.length > 40, `demo reply for "${q}"`);
}
assert.ok(demoReply(priya, saved, "what skills should I learn").includes(saved[0].missing_skills[0]), "skills answer is personalised");
assert.ok(demoReply(priya, saved, "tell me about UX Designer").startsWith("UX Designer"), "named career handled");
assert.ok(demoReply(priya, saved, "hello").includes("Priya"), "greets by name");

// --- Claude prompt + client ---
const sys = buildSystemPrompt(priya, saved);
assert.ok(sys.includes("Priya Sharma") && sys.includes("Python") && sys.includes(saved[0].career_title) && sys.includes("Missing skills"));

const realFetch = globalThis.fetch;
try {
  let seen;
  globalThis.fetch = async (url, init) => { seen = { url, init }; return new Response(JSON.stringify({ content: [{ type: "text", text: " Hi there " }] }), { status: 200 }); };
  const out = await askClaude({ apiKey: "k", model: "m", system: "s", messages: [{ role: "user", content: "q" }] });
  assert.equal(out, "Hi there");
  assert.equal(seen.url, "https://api.anthropic.com/v1/messages");
  assert.equal(seen.init.headers["x-api-key"], "k");
  assert.equal(seen.init.headers["anthropic-version"], "2023-06-01");
  const body = JSON.parse(seen.init.body);
  assert.deepEqual([body.model, body.system, body.max_tokens > 0], ["m", "s", true]);

  globalThis.fetch = async () => new Response("rate limited", { status: 429 });
  await assert.rejects(askClaude({ apiKey: "k", model: "m", system: "s", messages: [] }), /429/);
  globalThis.fetch = async () => new Response(JSON.stringify({ content: [] }), { status: 200 });
  await assert.rejects(askClaude({ apiKey: "k", model: "m", system: "s", messages: [] }), /no text/);
} finally {
  globalThis.fetch = realFetch;
}
console.log("Engine, demo mentor and Claude client tests passed");
