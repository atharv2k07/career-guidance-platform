// Minimal in-memory stand-in for the Supabase query builder (only what this app uses).
// It mirrors PostgREST behaviour we rely on: unique email, foreign key, upsert on conflict,
// single()/maybeSingle(), ordering and limits. It is NOT a substitute for the live smoke test.
import { randomUUID } from "node:crypto";

export const tables = { students: [], recommendations: [], conversations: [] };
let seq = 0;

class Query {
  constructor(t) { this.t = t; this.op = "select"; this.f = []; this.mode = "many"; this.returning = false; }
  select() { if (this.op !== "select") this.returning = true; return this; }
  insert(p) { this.op = "insert"; this.p = p; return this; }
  update(p) { this.op = "update"; this.p = p; return this; }
  upsert(p, o) { this.op = "upsert"; this.p = p; this.o = o ?? {}; return this; }
  eq(c, v) { this.f.push([c, v]); return this; }
  order(c, { ascending = true } = {}) { this.ord = [c, ascending]; return this; }
  limit(n) { this.lim = n; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }
  then(res, rej) { return Promise.resolve().then(() => this.run()).then(res, rej); }

  match(rows) { return rows.filter((r) => this.f.every(([c, v]) => r[c] === v)); }
  fail(code, message) { return { data: null, error: { code, message } }; }

  run() {
    const rows = tables[this.t];
    let out;
    if (this.op === "insert" || this.op === "upsert") {
      const incoming = Array.isArray(this.p) ? this.p : [this.p];
      out = [];
      for (const raw of incoming) {
        const row = { ...raw };
        if (this.op === "upsert") {
          const keys = this.o.onConflict.split(",");
          const i = rows.findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i >= 0) { rows[i] = { ...rows[i], ...row }; out.push(rows[i]); continue; }
        }
        if (this.t === "students") {
          if (rows.some((r) => r.email === row.email)) return this.fail("23505", "duplicate email");
          row.created_at = new Date().toISOString();
        }
        if (this.t === "conversations") {
          if (!tables.students.some((s) => s.id === row.student_id)) return this.fail("23503", "fk violation");
          row.seq = ++seq;
          row.created_at = new Date().toISOString();
        }
        row.id = randomUUID();
        rows.push(row);
        out.push(row);
      }
    } else if (this.op === "update") {
      out = this.match(rows);
      for (const r of out) {
        if (this.p.email && rows.some((o) => o !== r && o.email === this.p.email)) return this.fail("23505", "duplicate email");
        Object.assign(r, this.p);
      }
    } else {
      out = this.match(rows);
      if (this.ord) {
        const [c, asc] = this.ord;
        out = [...out].sort((a, b) => (a[c] > b[c] ? 1 : -1) * (asc ? 1 : -1));
      }
      if (this.lim) out = out.slice(0, this.lim);
    }
    if (this.op !== "select" && !this.returning) return { data: null, error: null };
    out = out.map((r) => ({ ...r }));
    if (this.mode === "single") return out.length === 1 ? { data: out[0], error: null } : this.fail("PGRST116", "expected one row");
    if (this.mode === "maybe") return { data: out[0] ?? null, error: null };
    return { data: out, error: null };
  }
}

export const createClient = () => ({ from: (t) => new Query(t) });
