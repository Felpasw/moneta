import type { RefObject } from "react";

export interface UseClickOutsideOptions {
  readonly ref: RefObject<HTMLElement | null>;
  readonly enabled: boolean;
  readonly onOutside: () => void;
}
