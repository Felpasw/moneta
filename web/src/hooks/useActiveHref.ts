"use client";

import { usePathname } from "next/navigation";

import type { UseActiveHrefItem } from "@/hooks/interfaces/useActiveHref.interface";

const resolveActiveHref = (
  pathname: string,
  hrefs: readonly string[],
): string | undefined =>
  hrefs
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

export function useActiveHref(
  items: readonly UseActiveHrefItem[],
): string | undefined {
  const pathname = usePathname();
  const hrefs = items
    .map((item) => item.href)
    .filter((href): href is string => href !== undefined);
  return resolveActiveHref(pathname ?? "", hrefs);
}
