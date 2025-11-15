"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  description?: string;
};

export function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col rounded-lg border border-transparent px-3 py-2 transition ${
              active
                ? "border-slate-700 bg-slate-800/80 text-white shadow-sm"
                : "text-slate-300 hover:border-slate-800 hover:bg-slate-900/70 hover:text-white"
            }`}
          >
            <span className="text-sm font-medium">{item.label}</span>
            {item.description && <span className="text-xs text-slate-400">{item.description}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
