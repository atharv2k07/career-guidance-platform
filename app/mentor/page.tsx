"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { getStudentId } from "@/lib/profile";

interface Msg {
  role: "user" | "assistant";
  content: string;
  source?: "claude" | "demo" | null;
}

const SESSION_KEY = "pathfinder_session_id";
const suggestions = [
  "Why do these careers fit me?",
  "What skills should I learn first?",
  "Give me a 30-day plan",
  "What projects should I build?",
];

export default function Mentor() {
  const [studentId, setStudentId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"claude" | "demo" | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = getStudentId();
    const sid = localStorage.getItem(SESSION_KEY);
    setStudentId(id);
    setSessionId(sid);
    fetch("/api/mentor").then((r) => r.json()).then((d) => setMode(d.mode)).catch(() => {});
    if (id && sid) {
      fetch(`/api/students/${id}/conversations?session_id=${sid}`)
        .then((r) => r.json())
        .then((d) => setMsgs(d.messages ?? []))
        .catch(() => {})
        .finally(() => setReady(true));
    } else setReady(true);
  }, []);

  useEffect(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), [msgs, sending]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || sending || !studentId) return;
    setInput("");
    setError("");
    setSending(true);
    setMsgs((m) => [...m, { role: "user", content: message }]);
    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, message, session_id: sessionId ?? undefined }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.details?.join("; ") || body.error || "Request failed");
      localStorage.setItem(SESSION_KEY, body.session_id);
      setSessionId(body.session_id);
      setMsgs((m) => [...m, { role: "assistant", content: body.reply, source: body.mode }]);
      if (body.notice) setError(body.notice);
      else if (!body.saved) setError("This reply could not be saved to your history.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  function newChat() {
    localStorage.removeItem(SESSION_KEY);
    setSessionId(null);
    setMsgs([]);
    setError("");
  }

  return (
    <>
      <AppNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">AI Mentor</h1>
            <p className="mt-1 text-slate-600">Ask anything about your career path. Answers use your saved profile.</p>
          </div>
          {mode && (
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${mode === "claude" ? "bg-indigo-100 text-indigo-700" : "bg-amber-100 text-amber-800"}`}>
              {mode === "claude" ? "Powered by Claude" : "Demo mode: pre-written replies, not AI"}
            </span>
          )}
        </div>

        {ready && !studentId ? (
          <div className="mt-8 rounded-2xl border border-slate-200 p-8 text-center">
            <p className="text-slate-600">Complete your profile first so the mentor knows your background.</p>
            <Link href="/onboarding" className="mt-5 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white hover:bg-indigo-700">
              Complete my profile
            </Link>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="h-[55vh] space-y-4 overflow-y-auto p-6">
              {msgs.length === 0 && ready && (
                <div className="text-center text-sm text-slate-500">
                  <p>Try one of these to get started:</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {suggestions.map((s) => (
                      <button key={s} onClick={() => send(s)} className="rounded-full border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                    {m.content}
                    {m.role === "assistant" && m.source === "demo" && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">Demo reply</p>
                    )}
                  </div>
                </div>
              ))}
              {sending && <p className="text-sm text-slate-500">Mentor is thinking…</p>}
              <div ref={bottom} />
            </div>

            {error && <p className="mx-6 mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{error}</p>}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex flex-wrap gap-3 border-t border-slate-100 p-4"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={1000}
                placeholder="Ask about careers, skills, projects…"
                className="min-w-0 basis-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none sm:flex-1 sm:basis-0 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button disabled={sending || !input.trim()} className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
                Send
              </button>
              <button type="button" onClick={newChat} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                New chat
              </button>
            </form>
          </div>
        )}
      </main>
    </>
  );
}
