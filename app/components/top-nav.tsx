"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navLinks = [
  { label: "Briefing", href: "/briefing" },
  { label: "Signals", href: "/signals" },
  { label: "Settings", href: "/settings" },
];

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/briefing") return pathname === "/" || pathname.startsWith("/briefing");
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl">
      <div className="flex justify-between items-center px-6 md:px-12 py-6 md:py-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="text-2xl font-semibold tracking-tighter text-on-surface">
          Hermes
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-12 font-normal tracking-tight text-base">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "text-on-surface font-medium border-b border-on-surface/10 transition-opacity duration-300"
                  : "text-secondary hover:text-on-surface transition-opacity duration-300"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {/* New Signal button */}
          <Link
            href="/signals/new"
            className="bg-primary text-on-primary px-6 py-2 rounded-md font-medium text-sm transition-all opacity-80 hover:opacity-100 active:opacity-100 whitespace-nowrap"
          >
            New Signal
          </Link>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            <span
              className={`block w-5 h-0.5 bg-on-surface transition-transform duration-200 ${
                mobileOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-on-surface transition-opacity duration-200 ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-5 h-0.5 bg-on-surface transition-transform duration-200 ${
                mobileOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`py-3 text-base tracking-tight ${
                  isActive(link.href)
                    ? "text-on-surface font-medium"
                    : "text-secondary"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
