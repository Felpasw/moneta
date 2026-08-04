import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@dicebear/core", () => {
  const createAvatar = vi.fn((_style: unknown, options: { seed?: string }) => {
    const seed = options?.seed ?? "";
    return {
      toDataUri: () => `data:image/svg+xml;utf8,<svg data-seed="${seed}"></svg>`,
      toString: () => `<svg data-seed="${seed}"></svg>`,
    };
  });

  return { createAvatar };
});

import { createAvatar } from "@dicebear/core";

import {
  ASSISTANT_AVATAR_STYLES,
  AssistantAvatar,
} from "@/components/atoms/AssistantAvatar";

const mockedAvatar = vi.mocked(createAvatar);

describe("AssistantAvatar", () => {
  beforeEach(() => {
    mockedAvatar.mockClear();
  });

  it("renderiza avatar DiceBear com style e seed extraídos do avatarUrl", () => {
    render(<AssistantAvatar avatarUrl="dicebear:notionists:felps" />);

    const img = screen.getByRole("img", { name: /avatar/i });
    expect(img).toBeInTheDocument();
    expect(img.getAttribute("src")).toContain('data-seed="felps"');

    expect(mockedAvatar).toHaveBeenCalledTimes(1);
    const [, options] = mockedAvatar.mock.calls[0];
    expect(options).toEqual({ seed: "felps" });
  });

  it("expõe pelo menos 15 styles curados na whitelist", () => {
    expect(ASSISTANT_AVATAR_STYLES.length).toBeGreaterThanOrEqual(15);
  });

  it("aceita todos os styles curados sem cair no fallback", () => {
    for (const style of ASSISTANT_AVATAR_STYLES) {
      mockedAvatar.mockClear();
      const { unmount } = render(
        <AssistantAvatar avatarUrl={`dicebear:${style}:seed`} />,
      );
      expect(mockedAvatar).toHaveBeenCalledTimes(1);
      unmount();
    }
  });

  it("usa fallback notionists + fallbackSeed quando avatarUrl é null", () => {
    render(<AssistantAvatar avatarUrl={null} fallbackSeed="felipe" />);

    expect(mockedAvatar).toHaveBeenCalledTimes(1);
    const [, options] = mockedAvatar.mock.calls[0];
    expect(options).toEqual({ seed: "felipe" });
  });

  it("usa fallback quando o style não está na lista curada", () => {
    render(
      <AssistantAvatar
        avatarUrl="dicebear:identicon:felps"
        fallbackSeed="fallback"
      />,
    );

    expect(mockedAvatar).toHaveBeenCalledTimes(1);
    const [, options] = mockedAvatar.mock.calls[0];
    expect(options).toEqual({ seed: "fallback" });
  });

  it("usa fallback quando o avatarUrl não bate com o formato esperado", () => {
    render(
      <AssistantAvatar avatarUrl="not-a-dicebear-url" fallbackSeed="fallback" />,
    );

    expect(mockedAvatar).toHaveBeenCalledTimes(1);
    const [, options] = mockedAvatar.mock.calls[0];
    expect(options).toEqual({ seed: "fallback" });
  });

  it("fallbackSeed default é 'user' quando não é passado", () => {
    render(<AssistantAvatar avatarUrl={null} />);

    expect(mockedAvatar).toHaveBeenCalledTimes(1);
    const [, options] = mockedAvatar.mock.calls[0];
    expect(options).toEqual({ seed: "user" });
  });

  it("aplica classes de estado 'idle' sem animação", () => {
    render(<AssistantAvatar avatarUrl="dicebear:notionists:x" state="idle" />);

    const img = screen.getByRole("img", { name: /avatar/i });
    expect(img.className).not.toContain("animate-pulse");
    expect(img.className).not.toContain("ring-2");
  });

  it("aplica classes de estado 'thinking' com opacidade e pulse lento", () => {
    render(
      <AssistantAvatar avatarUrl="dicebear:notionists:x" state="thinking" />,
    );

    const img = screen.getByRole("img", { name: /avatar/i });
    expect(img.className).toContain("opacity-70");
    expect(img.className).toContain("animate-pulse");
  });

  it("aplica classes de estado 'speaking' com ring e pulse", () => {
    render(
      <AssistantAvatar avatarUrl="dicebear:notionists:x" state="speaking" />,
    );

    const img = screen.getByRole("img", { name: /avatar/i });
    expect(img.className).toContain("animate-pulse");
    expect(img.className).toContain("ring-2");
  });

  it("aplica tamanhos sm/md/lg via classes h-*/w-*", () => {
    const cases: Array<["sm" | "md" | "lg", string]> = [
      ["sm", "h-8"],
      ["md", "h-16"],
      ["lg", "h-32"],
    ];

    for (const [size, expected] of cases) {
      const { unmount } = render(
        <AssistantAvatar avatarUrl="dicebear:notionists:x" size={size} />,
      );
      const img = screen.getByRole("img", { name: /avatar/i });
      expect(img.className).toContain(expected);
      unmount();
    }
  });

  it("memoiza SVG por (style, seed) — mudança só de estado não regenera", () => {
    const { rerender } = render(
      <AssistantAvatar avatarUrl="dicebear:notionists:felps" state="idle" />,
    );

    const callsAfterFirstRender = mockedAvatar.mock.calls.length;

    rerender(
      <AssistantAvatar avatarUrl="dicebear:notionists:felps" state="speaking" />,
    );
    expect(mockedAvatar).toHaveBeenCalledTimes(callsAfterFirstRender);

    rerender(
      <AssistantAvatar avatarUrl="dicebear:notionists:other" state="speaking" />,
    );
    expect(mockedAvatar).toHaveBeenCalledTimes(callsAfterFirstRender + 1);

    rerender(
      <AssistantAvatar avatarUrl="dicebear:personas:other" state="speaking" />,
    );
    expect(mockedAvatar).toHaveBeenCalledTimes(callsAfterFirstRender + 2);
  });

  it("mescla className passada com as classes internas", () => {
    render(
      <AssistantAvatar
        avatarUrl="dicebear:notionists:x"
        className="border-4"
      />,
    );

    const img = screen.getByRole("img", { name: /avatar/i });
    expect(img.className).toContain("border-4");
  });
});
