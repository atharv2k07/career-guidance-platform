import Link from "next/link";

const stats = [
  { value: "80%", label: "of students received conflicting career advice" },
  { value: "90%", label: "experience career confusion" },
  { value: "2.9/5", label: "average personalization of existing guidance" },
  { value: "35%", label: "struggle most with knowing which career suits them" },
];

const steps = [
  {
    title: "Tell us about you",
    text: "Share your skills, interests and academic background in a short onboarding form.",
  },
  {
    title: "Get matched",
    text: "Our AI compares your profile against career paths and ranks the best fits with clear reasons.",
  },
  {
    title: "Ask your mentor",
    text: "Chat with an AI mentor to explore roles, skill gaps and next steps — any time.",
  },
];

const features = [
  { title: "Personalized recommendations", text: "Matches based on you, not generic quizzes." },
  { title: "One consistent voice", text: "Clear, explained guidance instead of conflicting advice." },
  { title: "Student dashboard", text: "Track your profile, matches and progress in one place." },
  { title: "AI mentor chat", text: "Ask follow-up questions about any career path." },
];

const matches = [
  { role: "Data Analyst", score: 92 },
  { role: "Product Manager", score: 85 },
  { role: "UX Designer", score: 78 },
];

export default function Home() {
  return (
    <main>
      {/* Navbar */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold text-indigo-600">
            PathFinder<span className="text-slate-900"> AI</span>
          </Link>
          <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
            <a href="#problem" className="hover:text-slate-900">The problem</a>
            <a href="#how" className="hover:text-slate-900">How it works</a>
            <a href="#features" className="hover:text-slate-900">Features</a>
          </div>
          <Link
            href="/onboarding"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Get started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-indigo-50 to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
              AI career guidance for undergraduates
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Stop guessing your career. Start with clarity.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600">
              PathFinder AI turns your skills, interests and academic background into
              personalized career recommendations — and a mentor to guide every step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/onboarding"
                className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Find my career path
              </Link>
              <a
                href="#how"
                className="rounded-lg border border-slate-300 px-6 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                See how it works
              </a>
            </div>
          </div>

          {/* Preview card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
            <p className="text-sm font-semibold text-slate-500">Your top career matches</p>
            <div className="mt-4 space-y-4">
              {matches.map((m) => (
                <div key={m.role}>
                  <div className="flex justify-between text-sm font-medium">
                    <span>{m.role}</span>
                    <span className="text-indigo-600">{m.score}%</span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-indigo-500"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              💬 “Your analytical skills and interest in data make this a strong fit.”
            </div>
          </div>
        </div>
      </section>

      {/* Problem / stats */}
      <section id="problem" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Career confusion is the norm</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
          Our research with students shows existing guidance is not working.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.value} className="rounded-xl border border-slate-200 p-6 text-center">
              <div className="text-4xl font-extrabold text-indigo-600">{s.value}</div>
              <p className="mt-2 text-sm text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-xl bg-white p-6 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 font-bold text-white">
                  {i + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-bold">Built for student clarity</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to find the career that fits you?</h2>
          <Link
            href="/onboarding"
            className="mt-8 inline-block rounded-lg bg-white px-6 py-3 font-medium text-indigo-700 hover:bg-indigo-50"
          >
            Get started — it takes 2 minutes
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} PathFinder AI · Demo prototype
      </footer>
    </main>
  );
}
