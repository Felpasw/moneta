import { describe, expect, it } from "vitest";

import { buildAgentWsUrl } from "@/hooks/useAgentSession";

describe("buildAgentWsUrl()", () => {
  it("troca http:// por ws:// e anexa token", () => {
    expect(buildAgentWsUrl("http://localhost:3333", "abc.jwt")).toBe(
      "ws://localhost:3333/agent/ws?token=abc.jwt",
    );
  });

  it("troca https:// por wss://", () => {
    expect(buildAgentWsUrl("https://api.moneta.app", "abc.jwt")).toBe(
      "wss://api.moneta.app/agent/ws?token=abc.jwt",
    );
  });

  it("faz encode do token quando contém caracteres especiais", () => {
    expect(buildAgentWsUrl("http://x", "a b+c/d=")).toBe(
      "ws://x/agent/ws?token=a%20b%2Bc%2Fd%3D",
    );
  });
});
