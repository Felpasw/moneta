import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AgentActionIndicator } from "@/components/atoms/AgentActionIndicator";
import {
  ToolCaptionKey,
  ToolEventKind,
} from "@/hooks/constants/useAgentSession.constants";
import {
  agentSessionActions,
  useAgentSessionStore,
} from "@/stores/agentSessionStore";

describe("AgentActionIndicator", () => {
  beforeEach(() => {
    agentSessionActions.resetAll();
  });

  it("não renderiza nada quando não há tool ativa", () => {
    const { container } = render(
      <AgentActionIndicator outputLanguage="pt_BR" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renderiza caption traduzida em pt_BR", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: {
            key: ToolCaptionKey.InstallmentPurchaseRegistering,
            params: { count: 4 },
          },
        },
      ],
    });

    render(<AgentActionIndicator outputLanguage="pt_BR" />);
    expect(screen.getByText("Registrando compra em 4x…")).toBeInTheDocument();
  });

  it("renderiza caption traduzida em en_US", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: {
            key: ToolCaptionKey.TransferRegistering,
            params: {},
          },
        },
      ],
    });

    render(<AgentActionIndicator outputLanguage="en_US" />);
    expect(
      screen.getByText("Transferring between accounts…"),
    ).toBeInTheDocument();
  });

  it("some quando a tool ativa é resolvida", () => {
    useAgentSessionStore.setState({
      toolEvents: [
        {
          kind: ToolEventKind.Pending,
          callId: "call_1",
          caption: {
            key: ToolCaptionKey.TransferRegistering,
            params: {},
          },
        },
        { kind: ToolEventKind.Result, callId: "call_1" },
      ],
    });

    const { container } = render(
      <AgentActionIndicator outputLanguage="pt_BR" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
