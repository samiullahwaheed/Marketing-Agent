"use client";

import { useState } from "react";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // clipboard unavailable, ignore
        }
      }}
      className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-black/3"
    >
      {copied ? "Copied" : "Copy text"}
    </button>
  );
}
