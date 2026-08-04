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
  it("renderiza os 6 styles curados como opções clicáveis", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    for (const option of CURATED_AVATAR_STYLE_OPTIONS) {
      expect(
        screen.getByRole("button", { name: new RegExp(`escolher.*${option.label}`, "i") }),
      ).toBeInTheDocument();
    }
  });

  it("input de seed começa com o seed extraído do avatarUrl quando válido", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl="dicebear:personas:carlos"
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    const seedInput = screen.getByLabelText(/apelido/i) as HTMLInputElement;
    expect(seedInput.value).toBe("carlos");
  });

  it("input de seed cai pro defaultSeed quando avatarUrl é null", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    const seedInput = screen.getByLabelText(/apelido/i) as HTMLInputElement;
    expect(seedInput.value).toBe("felipe");
  });

  it("input de seed cai pro defaultSeed quando avatarUrl é inválido", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl="not-a-valid-avatar"
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    const seedInput = screen.getByLabelText(/apelido/i) as HTMLInputElement;
    expect(seedInput.value).toBe("felipe");
  });

  it("selecionar um style dispara onChange com dicebear:{style}:{seed}", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /escolher.*avataaars/i }),
    );

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("dicebear:avataaars:felipe");
  });

  it("alterar o seed atualiza a composição do avatarUrl na próxima seleção", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
      />,
    );

    const seedInput = screen.getByLabelText(/apelido/i);
    await userEvent.clear(seedInput);
    await userEvent.type(seedInput, "carlos");

    await userEvent.click(
      screen.getByRole("button", { name: /escolher.*micah/i }),
    );

    expect(onChange).toHaveBeenCalledWith("dicebear:micah:carlos");
  });

  it("não dispara onChange se o seed estiver vazio", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
      />,
    );

    const seedInput = screen.getByLabelText(/apelido/i);
    await userEvent.clear(seedInput);

    await userEvent.click(
      screen.getByRole("button", { name: /escolher.*micah/i }),
    );

    expect(onChange).not.toHaveBeenCalled();
  });

  it("marca com aria-pressed=true o style atualmente selecionado", () => {
    render(
      <AssistantSettingsAvatar
        avatarUrl="dicebear:lorelei:felipe"
        defaultSeed="felipe"
        onChange={vi.fn()}
      />,
    );

    const loreleiButton = screen.getByRole("button", {
      name: /escolher.*lorelei/i,
    });
    expect(loreleiButton.getAttribute("aria-pressed")).toBe("true");

    const micahButton = screen.getByRole("button", {
      name: /escolher.*micah/i,
    });
    expect(micahButton.getAttribute("aria-pressed")).toBe("false");
  });

  it("respeita a prop disabled — bloqueia seleção e input", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsAvatar
        avatarUrl={null}
        defaultSeed="felipe"
        onChange={onChange}
        disabled
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /escolher.*micah/i }),
    );
    expect(onChange).not.toHaveBeenCalled();

    const seedInput = screen.getByLabelText(/apelido/i);
    expect(seedInput).toBeDisabled();
  });
});
