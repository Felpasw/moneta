import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
});
