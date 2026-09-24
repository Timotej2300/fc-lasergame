"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cx } from "@/lib/utils";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/event", label: "Event" },
  { href: "/admin/skupiny", label: "Skupiny" },
  { href: "/admin/timer", label: "Timer" },
  { href: "/admin/pravidla", label: "Pravidlá" },
  { href: "/admin/nastavenia", label: "Nastavenia" },
  { href: "/admin/platby", label: "Platby / Zálohy" }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-56 shrink-0 border-r border-white/10 bg-panel p-5 flex flex-col gap-2 min-h-screen">
      <p className="font-display font-black text-lg mb-4 text-glow">FaceClub Admin</p>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={cx(
            "px-4 py-2.5 rounded-xl text-sm font-semibold transition",
            pathname === l.href ? "bg-accent text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
          )}
        >
          {l.label}
        </Link>
      ))}
      <a
        href="/poradie"
        target="_blank"
        rel="noreferrer"
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-accent2 hover:bg-white/5"
      >
        Poradie (TV) ↗
      </a>
      <button onClick={logout} className="mt-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-danger hover:bg-white/5 text-left">
        Odhlásiť sa
      </button>
    </aside>
  );
}
