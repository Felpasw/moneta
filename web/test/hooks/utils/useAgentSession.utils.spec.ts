import { describe, expect, it, vi } from "vitest";

import {
  ToolCaptionKey,
  ToolEventKind,
} from "@/hooks/constants/useAgentSession.constants";
import {
  makeSystemDispatcher,
  makeToolDispatcher,
} from "@/hooks/utils/useAgentSession.utils";

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

describe("makeToolDispatcher()", () => {
  it("propaga caption estruturada { key, params } no evento pending", () => {
    const onEvent = vi.fn();
    const dispatch = makeToolDispatcher(onEvent);

    dispatch(
      JSON.stringify({
        type: "tool.pending",
        callId: "call_abc",
        toolName: "add_installment_purchase",
        args: { installmentsCount: 4 },
        caption: {
          key: "installment_purchase.registering",
          params: { count: 4 },
        },
      }),
    );

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: ToolEventKind.Pending,
        callId: "call_abc",
        toolName: "add_installment_purchase",
        caption: {
          key: ToolCaptionKey.InstallmentPurchaseRegistering,
          params: { count: 4 },
        },
      }),
    );
  });

  it("caption ausente vira undefined no evento", () => {
    const onEvent = vi.fn();
    const dispatch = makeToolDispatcher(onEvent);

    dispatch(
      JSON.stringify({
        type: "tool.pending",
        callId: "call_nc",
        toolName: "list_transactions",
        args: {},
      }),
    );

    const call = onEvent.mock.calls[0]?.[0] as { caption?: unknown };
    expect(call.caption).toBeUndefined();
  });

  it("emite result e error com o kind correto", () => {
    const onEvent = vi.fn();
    const dispatch = makeToolDispatcher(onEvent);

    dispatch(
      JSON.stringify({
        type: "tool.result",
        callId: "call_r",
        result: { ok: true },
      }),
    );
    dispatch(
      JSON.stringify({
        type: "tool.error",
        callId: "call_e",
        message: "boom",
      }),
    );

    expect(onEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        kind: ToolEventKind.Result,
        callId: "call_r",
      }),
    );
    expect(onEvent).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        kind: ToolEventKind.Error,
        callId: "call_e",
        message: "boom",
      }),
    );
  });

  it("ignora envelope sem callId", () => {
    const onEvent = vi.fn();
    const dispatch = makeToolDispatcher(onEvent);

    dispatch(JSON.stringify({ type: "tool.pending" }));

    expect(onEvent).not.toHaveBeenCalled();
  });
});
