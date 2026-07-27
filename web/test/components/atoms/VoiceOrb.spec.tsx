import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { VoiceOrb } from "@/components/atoms/VoiceOrb";

vi.mock("ogl", () => {
  class FakeVec3 {
    set = vi.fn();
    value = 0;
  }
  class FakeRenderer {
    gl = {
      canvas: document.createElement("canvas"),
      clearColor: vi.fn(),
      enable: vi.fn(),
      blendFunc: vi.fn(),
      clear: vi.fn(),
      BLEND: 0,
      SRC_ALPHA: 0,
      ONE_MINUS_SRC_ALPHA: 0,
      COLOR_BUFFER_BIT: 0,
      DEPTH_BUFFER_BIT: 0,
      getExtension: vi.fn(() => ({ loseContext: vi.fn() })),
    };
    setSize = vi.fn();
    render = vi.fn();
  }
  class FakeProgram {
    uniforms = {
      iTime: { value: 0 },
      iResolution: { value: new FakeVec3() },
      hue: { value: 0 },
      hover: { value: 0 },
      rot: { value: 0 },
      hoverIntensity: { value: 0 },
    };
  }
  return {
    Renderer: FakeRenderer,
    Program: FakeProgram,
    Triangle: class {},
    Mesh: class {},
    Vec3: FakeVec3,
  };
});

const createMediaElementSourceSpy = vi.fn(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
const createMediaStreamSourceSpy = vi.fn(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
}));
const createAnalyserSpy = vi.fn(() => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  fftSize: 512,
  smoothingTimeConstant: 0,
  minDecibels: 0,
  maxDecibels: 0,
  frequencyBinCount: 256,
  getByteFrequencyData: vi.fn(),
}));

class FakeAudioContext {
  state = "running";
  destination = {};
  createMediaElementSource = createMediaElementSourceSpy;
  createMediaStreamSource = createMediaStreamSourceSpy;
  createAnalyser = createAnalyserSpy;
  resume = vi.fn(async () => undefined);
  close = vi.fn(async () => undefined);
}

beforeEach(() => {
  createMediaElementSourceSpy.mockClear();
  createMediaStreamSourceSpy.mockClear();
  createAnalyserSpy.mockClear();
  (globalThis as unknown as { AudioContext: typeof FakeAudioContext }).AudioContext =
    FakeAudioContext;
});

afterEach(() => {
  delete (globalThis as unknown as { AudioContext?: typeof FakeAudioContext })
    .AudioContext;
});

const flushMicrotasks = () =>
  new Promise<void>((resolve) => setTimeout(resolve, 0));

describe("<VoiceOrb />", () => {
  it("renderiza wrapper com className passado", () => {
    const { container } = render(<VoiceOrb className="my-orb" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("my-orb");
  });

  it("desmonta sem erros", () => {
    const { unmount } = render(<VoiceOrb />);
    expect(() => unmount()).not.toThrow();
  });

  it("conecta MediaElementSource quando audioElement é passado", async () => {
    const audio = document.createElement("audio");
    render(<VoiceOrb audioElement={audio} />);
    await flushMicrotasks();

    expect(createMediaElementSourceSpy).toHaveBeenCalledWith(audio);
    expect(createMediaStreamSourceSpy).not.toHaveBeenCalled();
  });

  it("NÃO aceita mais a prop audioStream — mic do user nunca dispara o analyser", async () => {
    const fakeStream = {} as MediaStream;
    render(
      <VoiceOrb
        {...({ audioStream: fakeStream } as unknown as Record<string, never>)}
      />,
    );
    await flushMicrotasks();

    expect(createMediaStreamSourceSpy).not.toHaveBeenCalled();
    expect(createMediaElementSourceSpy).not.toHaveBeenCalled();
  });
});
