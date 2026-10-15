import type { ReactNode } from "react";

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const claimMark = "bg-[#F7E2B8] text-ink px-0.5 rounded-[3px]";
const keywordMark = "border-b-2 border-[#5E9A78] bg-[#EEF5F0] px-0.5";
const changeMark = "bg-[#F7E2B8] text-ink px-0.5 rounded-[3px]";

/** Wraps the unsourced claim in a <mark> and underlines keywords. */
export function highlight(text: string, claim: string | null, keywords: string[]): ReactNode[] {
  const terms = [claim, ...keywords].filter((t): t is string => !!t);
  if (!terms.length) return [text];
  const re = new RegExp(`(${terms.map(escape).join("|")})`, "gi");
  return text.split(re).map((part, i) => {
    if (claim && part.toLowerCase() === claim.toLowerCase()) {
      return (
        <mark key={i} className={claimMark}>
          {part}
        </mark>
      );
    }
    if (keywords.some((k) => k.toLowerCase() === part.toLowerCase())) {
      return (
        <span key={i} className={keywordMark}>
          {part}
        </span>
      );
    }
    return part;
  });
}

/** Renders text where [[…]] marks what the rewrite changed. */
export function markChanges(text: string): ReactNode[] {
  return text.split(/(\[\[.*?\]\])/g).map((part, i) =>
    part.startsWith("[[") ? (
      <mark key={i} className={changeMark}>
        {part.slice(2, -2)}
      </mark>
    ) : (
      part
    )
  );
}

export const paragraphs = (text: string) => text.split(/\n\n+/).filter((p) => p.trim());
