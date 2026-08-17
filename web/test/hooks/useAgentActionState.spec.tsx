import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ToolCaptionKey,
  ToolEventKind,
} from "@/hooks/constants/useAgentSession.constants";
import { useAgentActionState } from "@/hooks/useAgentActionState";
import {
  agentSessionActions,
  useAgentSessionStore,
} from "@/stores/agentSessionStore";

const CAPTION = {
  key: ToolCaptionKey.InstallmentPurchaseRegistering,
  params: { count: 4 },
};

describe("useAgentActionState()", () => {
  beforeEach(() => {
    agentSessionActions.resetAll();
  });

  it("retorna null quando não há tool events", () => {
    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toBeNull();
  });

  it("retorna caption da última tool Pending", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          toolName: "add_installment_purchase",
          caption: CAPTION,
        },
      ],
    });

    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toEqual(CAPTION);
  });

  it("retorna null quando o último evento é Result", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: CAPTION,
        },
        { kind: ToolEventKind.Result, callId: "call_1" },
      ],
    });

    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toBeNull();
  });

  it("retorna null quando a Pending mais recente já foi resolvida por Error", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: CAPTION,
        },
        { kind: ToolEventKind.Error, callId: "call_1", message: "boom" },
      ],
    });

    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toBeNull();
  });

  it("prioriza a Pending mais recente quando há várias em paralelo", () => {
    const later = {
      key: ToolCaptionKey.TransferRegistering,
      params: {},
    };
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: CAPTION,
        },
        {
          kind: ToolEventKind.Pending,
          callId: "call_2",
          caption: later,
        },
      ],
    });

    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toEqual(later);
  });

  it("retorna null quando a última Pending não tem caption", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        { kind: ToolEventKind.Pending, callId: "call_1", toolName: "list_x" },
      ],
    });

    const { result } = renderHook(() => useAgentActionState());
    expect(result.current).toBeNull();
  });
});
