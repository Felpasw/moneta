"use client";

import { ToolEventKind } from "@/hooks/constants/useAgentSession.constants";
import type {
  ToolCaption,
  ToolEvent,
} from "@/hooks/interfaces/useAgentSession.interface";
import { useAgentSessionStore } from "@/stores/agentSessionStore";

const findActivePending = (events: readonly ToolEvent[]): ToolEvent | null => {
  const resolved = new Set<string>();
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i];
    if (e.kind === ToolEventKind.Result || e.kind === ToolEventKind.Error) {
      resolved.add(e.callId);
      continue;
    }
    if (e.kind === ToolEventKind.Pending && !resolved.has(e.callId)) {
      return e;
    }
  }
  return null;
};

export function useAgentActionState(): ToolCaption | null {
  const events = useAgentSessionStore((s) => s.toolEvents);
  const active = findActivePending(events);
  return active?.caption ?? null;
}
