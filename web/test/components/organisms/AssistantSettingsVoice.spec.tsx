import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AssistantSettingsVoice } from "@/components/organisms/AssistantSettingsVoice";
import type { TtsVoice } from "@/services/interfaces/assistantProfile.interface";

const VOICES: TtsVoice[] = [
  { voiceId: "v-1", name: "Bella", language: "pt-BR" },
  { voiceId: "v-2", name: "Adam", language: "en-US" },
  { voiceId: "v-3", name: "Rachel" },
];

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

const audioPlayMock = vi.fn().mockResolvedValue(undefined);
const audioPauseMock = vi.fn();

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => `blob:mock:${Math.random()}`);
  URL.revokeObjectURL = vi.fn();
  HTMLMediaElement.prototype.play = audioPlayMock;
  HTMLMediaElement.prototype.pause = audioPauseMock;
  audioPlayMock.mockClear();
  audioPauseMock.mockClear();
});

afterEach(() => {
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("AssistantSettingsVoice", () => {
  it("renderiza um card por voz com nome e idioma", () => {
    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    expect(screen.getByText("Bella")).toBeInTheDocument();
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Rachel")).toBeInTheDocument();
    expect(screen.getByText(/pt-br/i)).toBeInTheDocument();
    expect(screen.getByText(/en-us/i)).toBeInTheDocument();
  });

  it("marca o card selecionado com aria-pressed=true no botão principal", () => {
    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-2"
        onSelect={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    const adamSelect = screen.getByRole("button", { name: /select adam/i });
    expect(adamSelect.getAttribute("aria-pressed")).toBe("true");

    const bellaSelect = screen.getByRole("button", {
      name: /select bella/i,
    });
    expect(bellaSelect.getAttribute("aria-pressed")).toBe("false");
  });

  it("dispara onSelect com o voiceId ao clicar no card", async () => {
    const onSelect = vi.fn();
    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={onSelect}
        onPreview={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /select rachel/i }),
    );

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("v-3");
  });

  it("não dispara onSelect ao clicar na voz já selecionada", async () => {
    const onSelect = vi.fn();
    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={onSelect}
        onPreview={vi.fn()}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /select bella/i }),
    );

    expect(onSelect).not.toHaveBeenCalled();
  });

  it("chama onPreview com o voiceId ao clicar em ▶ preview e toca o áudio", async () => {
    const blob = new Blob([new Uint8Array([1, 2])], { type: "audio/mpeg" });
    const onPreview = vi.fn().mockResolvedValue(blob);

    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={vi.fn()}
        onPreview={onPreview}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /preview bella/i }),
    );

    expect(onPreview).toHaveBeenCalledWith("v-1");
    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(audioPlayMock).toHaveBeenCalled();
  });

  it("pausa o preview anterior quando outro é iniciado (single-active)", async () => {
    const blob = new Blob([new Uint8Array([1, 2])], { type: "audio/mpeg" });
    const onPreview = vi.fn().mockResolvedValue(blob);

    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={vi.fn()}
        onPreview={onPreview}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /preview bella/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /preview adam/i }),
    );

    expect(audioPauseMock).toHaveBeenCalled();
    expect(audioPlayMock).toHaveBeenCalledTimes(2);
  });

  it("respeita a prop disabled — não seleciona nem preview", async () => {
    const onSelect = vi.fn();
    const onPreview = vi.fn();

    render(
      <AssistantSettingsVoice
        voices={VOICES}
        selectedVoiceId="v-1"
        onSelect={onSelect}
        onPreview={onPreview}
        disabled
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /select rachel/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /preview bella/i }),
    );

    expect(onSelect).not.toHaveBeenCalled();
    expect(onPreview).not.toHaveBeenCalled();
  });

  it("renderiza mensagem vazia quando a lista está vazia", () => {
    render(
      <AssistantSettingsVoice
        voices={[]}
        selectedVoiceId=""
        onSelect={vi.fn()}
        onPreview={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/no voices available/i),
    ).toBeInTheDocument();
  });
});
