"use client";

import { useEffect } from "react";

import type { UseClickOutsideOptions } from "@/hooks/interfaces/useClickOutside.interface";

export function useClickOutside({
  ref,
  enabled,
  onOutside,
}: UseClickOutsideOptions): void {
  useEffect(() => {
    if (!enabled) return undefined;
    const handler = (event: MouseEvent | TouchEvent): void => {
      const target = event.target as Node | null;
      if (target === null) return;
      if (ref.current?.contains(target)) return;
      onOutside();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [enabled, ref, onOutside]);
}
