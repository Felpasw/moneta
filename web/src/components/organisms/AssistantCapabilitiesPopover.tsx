"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";

import { CAPABILITIES, POPOVER_TRANSITION } from "@/components/organisms/assistantCapabilities.constants";
import type { AssistantCapabilitiesPopoverProps } from "@/components/organisms/interfaces/AssistantCapabilitiesPopover.interface";
import { useClickOutside } from "@/hooks/useClickOutside";

export function AssistantCapabilitiesPopover({
  open,
  onOpenChange,
}: AssistantCapabilitiesPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useClickOutside({
    ref: panelRef,
    enabled: open,
    onOutside: () => onOpenChange(false),
  });

  return (
    <AnimatePresence>
      {open ? (
        <motion.aside
          ref={panelRef}
          role="dialog"
          aria-label="Assistant capabilities"
          initial={{ opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={POPOVER_TRANSITION}
          className="fixed bottom-16 left-1/2 z-50 w-[min(320px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl bg-neutral-900 text-neutral-50 shadow-2xl ring-1 ring-white/10"
        >
          <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
              What I can do
            </p>
            <button
              type="button"
              aria-label="Close"
              onClick={() => onOpenChange(false)}
              className="flex size-6 cursor-pointer items-center justify-center rounded-md opacity-60 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/40"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
            </button>
          </header>
          <ul className="flex flex-col p-1">
            {CAPABILITIES.map((capability) => {
              const { Icon } = capability;
              return (
                <li key={capability.id}>
                  <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-white/5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                      <Icon aria-hidden className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-sm">{capability.title}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}

export default AssistantCapabilitiesPopover;
