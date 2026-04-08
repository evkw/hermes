"use client";

import { ExternalLink, Copy } from "lucide-react";

export function SourceRow({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <>
      <button
        type="button"
        className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
        aria-label="Copy URL"
        onClick={() => navigator.clipboard.writeText(url)}
      >
        <Copy className="size-3.5" />
      </button>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
        aria-label="Open URL"
      >
        <ExternalLink className="size-3.5" />
      </a>
    </>
  );
}
