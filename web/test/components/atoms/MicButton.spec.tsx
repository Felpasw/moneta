import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MicButton } from "@/components/atoms/MicButton";
import { MicState } from "@/hooks/useAgentSession";

describe("<MicButton />", () => {
  it("mostra o ícone de mic ligado quando state=live", () => {
    render(<MicButton state={MicState.Live} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /desligar mic/i }),
    ).toBeInTheDocument();
  });

  it("mostra o ícone de mic desligado quando state=off", () => {
    render(<MicButton state={MicState.Off} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /ligar mic/i }),
    ).toBeInTheDocument();
  });

  it("mostra ícone de alerta quando state=denied e desabilita o botão", () => {
    render(<MicButton state={MicState.Denied} onToggle={vi.fn()} />);
    const button = screen.getByRole("button", { name: /permissão negada/i });
    expect(button).toBeDisabled();
  });

  it("chama onToggle quando clicado (state=off)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<MicButton state={MicState.Off} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /ligar mic/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("chama onToggle quando clicado (state=live)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<MicButton state={MicState.Live} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /desligar mic/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
