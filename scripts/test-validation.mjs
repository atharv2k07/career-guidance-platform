// Offline test (no database): node scripts/test-validation.mjs
import assert from "node:assert/strict";
import { validateStudent, validateMessages, isUuid } from "../lib/validation.ts";
import { recommend, getCareer, skillSuggestions } from "../lib/careers.ts";

const good = {
  full_name: " Priya Sharma ", email: "Priya@Example.com", college: "SIT", branch: "Computer Science",
  year_of_study: 3, skills: ["Python", "python", " SQL "], interests: ["AI"], career_goal: "Data scientist",
};

let r = validateStudent(good);
assert.ok(r.ok, "valid student accepted");
assert.equal(r.data.email, "priya@example.com");
assert.equal(r.data.full_name, "Priya Sharma");
assert.deepEqual(r.data.skills, ["Python", "SQL"], "trimmed + de-duplicated");

for (const [label, patch] of [
  ["bad email", { email: "nope" }],
  ["year 9", { year_of_study: 9 }],
  ["year as string", { year_of_study: "3" }],
  ["empty name", { full_name: "  " }],
  ["empty skills", { skills: [] }],
  ["skills not array", { skills: "Python" }],
  ["name too long", { full_name: "x".repeat(101) }],
  ["too many skills", { skills: Array.from({ length: 21 }, (_, i) => "s" + i) }],
]) {
  assert.equal(validateStudent({ ...good, ...patch }).ok, false, label + " rejected");
}
assert.equal(validateStudent(null).ok, false);
assert.equal(validateStudent("x").ok, false);

assert.ok(isUuid(crypto.randomUUID()));
assert.ok(!isUuid("123") && !isUuid("../etc/passwd"));

let m = validateMessages({ messages: [{ role: "user", content: "hi" }, { role: "assistant", content: "hello" }] });
assert.ok(m.ok && isUuid(m.data.session_id), "session_id generated");
assert.equal(validateMessages({ messages: [{ role: "system", content: "x" }] }).ok, false);
assert.equal(validateMessages({ messages: [] }).ok, false);
assert.equal(validateMessages({ messages: [{ role: "user", content: "x".repeat(4001) }] }).ok, false);
assert.equal(validateMessages({ session_id: "bad", messages: [{ role: "user", content: "x" }] }).ok, false);

const recs = recommend(r.data);
assert.equal(recs.length, 3);
assert.ok(recs.every((x) => x.score >= 0 && x.score <= 100 && x.reason));
assert.ok(getCareer(recs[0].title), "top career resolvable for skill suggestions");
assert.ok(Array.isArray(skillSuggestions(r.data, getCareer(recs[0].title))));

console.log("All validation + recommendation tests passed");
