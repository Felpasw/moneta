import { describe, expect, it } from "vitest";

import { buildAgentWsUrl } from "@/hooks/useAgentSession";

describe("buildAgentWsUrl()", () => {
  it("troca http:// por ws://", () => {
    expect(buildAgentWsUrl("http://localhost:3333")).toBe(
      "ws://localhost:3333/agent/ws",
    );
  });

  it("troca https:// por wss://", () => {
    expect(buildAgentWsUrl("https://api.moneta.app")).toBe(
      "wss://api.moneta.app/agent/ws",
    );
  });

  it("não anexa token na query (cookie httpOnly sobe automático no handshake)", () => {
    expect(buildAgentWsUrl("http://x")).not.toContain("?token=");
  });
});
