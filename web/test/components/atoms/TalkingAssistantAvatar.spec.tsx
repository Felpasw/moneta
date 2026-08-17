import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@dicebear/core", () => {
  const createAvatar = vi.fn((_style: unknown, options: { seed?: string }) => ({
    toDataUri: () => `data:image/svg+xml;utf8,<svg data-seed="${options?.seed ?? ""}"></svg>`,
    toString: () => "<svg></svg>",
  }));
  return { createAvatar };
});


interface FakeAnalyser {
  fftSize: number;
  smoothingTimeConstant: number;
  minDecibels: number;
  maxDecibels: number;
  frequencyBinCount: number;
  getByteFrequencyData: (arr: Uint8Array) => void;
}

interface FakeAudioContext {
  state: string;
  createAnalyser: () => FakeAnalyser;
  createMediaElementSource: () => { connect: (node: unknown) => void };
  destination: object;
  resume: () => Promise<void>;
  close: () => Promise<void>;
}

let audioContextInstances = 0;

class MockAudioContext implements FakeAudioContext {
  state = "running";
  destination = {};
  constructor() {
    audioContextInstances += 1;
  }
  createAnalyser(): FakeAnalyser {
    return {
      fftSize: 0,
      smoothingTimeConstant: 0,
      minDecibels: 0,
      maxDecibels: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: () => undefined,
      disconnect: () => undefined,
    } as unknown as FakeAnalyser;
  }
  createMediaElementSource() {
    return {
      connect: () => undefined,
      disconnect: () => undefined,
    };
  }
  async resume() {
    return;
  }
  async close() {
    return;
  }
}

import { TalkingAssistantAvatar } from "@/components/atoms/TalkingAssistantAvatar";

describe("<TalkingAssistantAvatar />", () => {
  beforeEach(() => {
    audioContextInstances = 0;
    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext =
      MockAudioContext;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o AssistantAvatar interno refletindo o avatarUrl", () => {
    render(
      <TalkingAssistantAvatar
        avatarUrl="dicebear:notionists:felps"
        audioElement={null}
      />,
    );

    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toMatch(/notionists/i);
  });

  it("não instancia AudioContext quando audioElement é null", () => {
    render(
      <TalkingAssistantAvatar
        avatarUrl="dicebear:notionists:felps"
        audioElement={null}
      />,
    );

    expect(audioContextInstances).toBe(0);
  });

  it("instancia AudioContext quando recebe um audioElement", () => {
    const audio = document.createElement("audio");
    render(
      <TalkingAssistantAvatar
        avatarUrl="dicebear:notionists:felps"
        audioElement={audio}
      />,
    );

    expect(audioContextInstances).toBe(1);
  });

  it("aceita fallbackSeed e className", () => {
    const { container } = render(
      <TalkingAssistantAvatar
        avatarUrl={null}
        fallbackSeed="felipe"
        className="custom-class"
        audioElement={null}
      />,
    );

    expect(container.querySelector(".custom-class")).not.toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("wrapper do pulso reflete interruptSignal via data-pulse-key", () => {
    const { container, rerender } = render(
      <TalkingAssistantAvatar
        avatarUrl={null}
        fallbackSeed="felipe"
        audioElement={null}
        interruptSignal={0}
      />,
    );

    expect(
      container.querySelector('[data-pulse-key="0"]'),
    ).toBeInTheDocument();

    rerender(
      <TalkingAssistantAvatar
        avatarUrl={null}
        fallbackSeed="felipe"
        audioElement={null}
        interruptSignal={1}
      />,
    );

    expect(
      container.querySelector('[data-pulse-key="1"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-pulse-key="0"]'),
    ).not.toBeInTheDocument();
  });

  it("wrapper do pulso é remontado a cada bump (barge-in múltiplo)", () => {
    const { container, rerender } = render(
      <TalkingAssistantAvatar
        avatarUrl={null}
        fallbackSeed="felipe"
        audioElement={null}
        interruptSignal={1}
      />,
    );

    const first = container.querySelector('[data-pulse-key="1"]');
    expect(first).toBeInTheDocument();

    rerender(
      <TalkingAssistantAvatar
        avatarUrl={null}
        fallbackSeed="felipe"
        audioElement={null}
        interruptSignal={2}
      />,
    );

    const second = container.querySelector('[data-pulse-key="2"]');
    expect(second).toBeInTheDocument();
    expect(second).not.toBe(first);
  });
});
