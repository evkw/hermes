"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsNav = [
  { label: "Origin Mappings", href: "/settings/origin-mappings" },
  { label: "People", href: "/settings/people" },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex md:flex-col gap-1">
      {settingsNav.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={
              active
                ? "px-3 py-1.5 text-sm font-medium text-on-surface bg-outline-variant/20 rounded-md"
                : "px-3 py-1.5 text-sm text-secondary hover:text-on-surface hover:bg-outline-variant/10 rounded-md transition-colors"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
