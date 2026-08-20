import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MicButton } from "@/components/atoms/MicButton";
import { MicState } from "@/hooks/useAgentSession";

describe("<MicButton />", () => {
  it("shows the mic-on icon when state=live", () => {
    render(<MicButton state={MicState.Live} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /turn off mic/i }),
    ).toBeInTheDocument();
  });

  it("shows the mic-off icon when state=off", () => {
    render(<MicButton state={MicState.Off} onToggle={vi.fn()} />);
    expect(
      screen.getByRole("button", { name: /turn on mic/i }),
    ).toBeInTheDocument();
  });

  it("shows the alert icon when state=denied and disables the button", () => {
    render(<MicButton state={MicState.Denied} onToggle={vi.fn()} />);
    const button = screen.getByRole("button", { name: /permission denied/i });
    expect(button).toBeDisabled();
  });

  it("calls onToggle when clicked (state=off)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<MicButton state={MicState.Off} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /turn on mic/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls onToggle when clicked (state=live)", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<MicButton state={MicState.Live} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /turn off mic/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
