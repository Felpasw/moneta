import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Info } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { ShinyButton } from "@/components/atoms/ShinyButton";

describe("<ShinyButton />", () => {
  it("renderiza o icon dentro do botão", () => {
    render(
      <ShinyButton
        icon={<Info data-testid="icon" />}
        ariaLabel="Info assistant"
      />,
    );
    expect(screen.getByRole("button", { name: /info assistant/i })).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });

  it("aplica classes de variant green quando variant=green", () => {
    render(
      <ShinyButton
        icon={<Info />}
        variant="green"
        ariaLabel="Green action"
      />,
    );
    const button = screen.getByRole("button", { name: /green action/i });
    expect(button.className).toMatch(/border-green-500/);
  });

  it("aplica variant default quando prop ausente", () => {
    render(<ShinyButton icon={<Info />} ariaLabel="Default action" />);
    const button = screen.getByRole("button", { name: /default action/i });
    expect(button.className).toMatch(/border-white/);
  });

  it("chama onClick quando clicado", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <ShinyButton
        icon={<Info />}
        onClick={onClick}
        ariaLabel="Clickable"
      />,
    );
    await user.click(screen.getByRole("button", { name: /clickable/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("mescla className customizada", () => {
    render(
      <ShinyButton
        icon={<Info />}
        className="custom-marker"
        ariaLabel="Custom"
      />,
    );
    expect(screen.getByRole("button", { name: /custom/i }).className).toMatch(
      /custom-marker/,
    );
  });
});
