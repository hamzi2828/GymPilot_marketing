import Link from "next/link";
import { featureHref } from "@/content/features";
import type { Linked } from "@/content/site";

/** The key a list can use for a line of copy, linked or not. */
export const linkedKey = (item: Linked) => (typeof item === "string" ? item : item.text);

/**
 * A line of copy that may lead to a feature's own page. Plain text stays
 * plain; a linked line keeps the surrounding style and gains a quiet
 * underline, so a list still reads as a list.
 */
export default function LinkedText({ item }: { item: Linked }) {
  if (typeof item === "string") return <>{item}</>;
  return (
    <Link
      href={featureHref(item.feature)}
      className="rounded-sm underline decoration-gp-slate decoration-dotted underline-offset-4 transition-colors hover:text-gp-bone hover:decoration-gp-mint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gp-mint"
    >
      {item.text}
    </Link>
  );
}
