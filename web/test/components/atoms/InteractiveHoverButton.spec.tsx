import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InteractiveHoverButton } from "@/components/atoms/InteractiveHoverButton";

describe("<InteractiveHoverButton />", () => {
  it("renderiza texto idle por padrão", () => {
    render(<InteractiveHoverButton text="Entrar" />);
    expect(screen.getAllByText(/entrar/i).length).toBeGreaterThan(0);
  });

  it("mostra loadingText quando status='loading'", () => {
    render(
      <InteractiveHoverButton
        text="Entrar"
        loadingText="Entrando…"
        status="loading"
      />,
    );
    expect(screen.getByText(/entrando/i)).toBeInTheDocument();
  });

  it("mostra successText quando status='success'", () => {
    render(
      <InteractiveHoverButton
        text="Entrar"
        successText="Beleza!"
        status="success"
      />,
    );
    expect(screen.getByText(/beleza/i)).toBeInTheDocument();
  });

  it("chama onClick quando status='idle'", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<InteractiveHoverButton text="Entrar" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /entrar/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("fica disabled enquanto status !== idle", () => {
    render(<InteractiveHoverButton text="Entrar" status="loading" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("respeita type='submit'", () => {
    render(<InteractiveHoverButton text="Entrar" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
