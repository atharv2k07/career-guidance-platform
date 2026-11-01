import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard#recommendations", label: "Careers" },
  { href: "/dashboard#skills", label: "Skills" },
  { href: "/mentor", label: "AI Mentor" },
];

export default function AppNav() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          PathFinder<span className="text-slate-900"> AI</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm text-slate-600 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-slate-900">
              {l.label}
            </Link>
          ))}
        </div>
        <Link
          href="/onboarding"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Edit profile
        </Link>
      </nav>
      {/* Mobile: the same links, since the desktop row is hidden below md */}
      <div className="flex gap-6 overflow-x-auto px-6 pb-3 text-sm text-slate-600 md:hidden">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="whitespace-nowrap hover:text-slate-900">
            {l.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
