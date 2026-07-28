import { describe, expect, it, vi } from "vitest";

import { makeSystemDispatcher } from "@/hooks/utils/useAgentSession.utils";

describe("makeSystemDispatcher()", () => {
  it("chama onRedirect com target quando envelope system.redirect chega", () => {
    const onRedirect = vi.fn();
    const dispatch = makeSystemDispatcher({ onRedirect });

    dispatch(
      JSON.stringify({ type: "system.redirect", target: "/dashboard" }),
    );

    expect(onRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("ignora envelopes de outros tipos (tool.result, tts.audio.delta)", () => {
    const onRedirect = vi.fn();
    const dispatch = makeSystemDispatcher({ onRedirect });

    dispatch(JSON.stringify({ type: "tool.result", result: {} }));
    dispatch(JSON.stringify({ type: "tts.audio.delta", audio: "AA" }));

    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("ignora system.redirect sem target", () => {
    const onRedirect = vi.fn();
    const dispatch = makeSystemDispatcher({ onRedirect });

    dispatch(JSON.stringify({ type: "system.redirect" }));

    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("ignora payloads não-string (binary do WS)", () => {
    const onRedirect = vi.fn();
    const dispatch = makeSystemDispatcher({ onRedirect });

    dispatch(new ArrayBuffer(8));
    dispatch(null);
    dispatch(undefined);

    expect(onRedirect).not.toHaveBeenCalled();
  });

  it("ignora string que não é JSON válido", () => {
    const onRedirect = vi.fn();
    const dispatch = makeSystemDispatcher({ onRedirect });

    dispatch("not json {{{");

    expect(onRedirect).not.toHaveBeenCalled();
  });
});
