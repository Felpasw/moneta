import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

import { AssistantSettingsAvatar } from "@/components/organisms/AssistantSettingsAvatar";
import { CURATED_AVATAR_STYLE_OPTIONS } from "@/components/organisms/assistantSettings.constants";

describe("AssistantSettingsAvatar", () => {
  it("renderiza um botão pra cada style curado", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    for (const option of CURATED_AVATAR_STYLE_OPTIONS) {
      expect(
        screen.getByRole("button", {
          name: new RegExp(`choose ${option.label} style`, "i"),
        }),
      ).toBeInTheDocument();
    }
  });

  it("clicar num style dispara onChange com dicebear:{style}:cuzi", async () => {
    const onChange = vi.fn();
    const firstOption = CURATED_AVATAR_STYLE_OPTIONS[0];
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`choose ${firstOption.label} style`, "i"),
      }),
    );

    expect(onChange).toHaveBeenCalledWith(
      `dicebear:${firstOption.value}:cuzi`,
    );
  });

  it("marca com aria-pressed=true o style atual do avatarUrl", () => {
    const secondOption = CURATED_AVATAR_STYLE_OPTIONS[1];
    render(
      <AssistantSettingsAvatar
        avatarUrl={`dicebear:${secondOption.value}:cuzi`}
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    const secondButton = screen.getByRole("button", {
      name: new RegExp(`choose ${secondOption.label} style`, "i"),
    });
    expect(secondButton.getAttribute("aria-pressed")).toBe("true");

    const firstOption = CURATED_AVATAR_STYLE_OPTIONS[0];
    const firstButton = screen.getByRole("button", {
      name: new RegExp(`choose ${firstOption.label} style`, "i"),
    });
    expect(firstButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("respeita a prop disabled — bloqueia seleção", async () => {
    const onChange = vi.fn();
    const firstOption = CURATED_AVATAR_STYLE_OPTIONS[0];
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
        disabled
      />,
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: new RegExp(`choose ${firstOption.label} style`, "i"),
      }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });
});
