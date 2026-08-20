import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { InteractiveHoverButton } from "@/components/atoms/InteractiveHoverButton";

describe("<InteractiveHoverButton />", () => {
  it("renders idle text by default", () => {
    render(<InteractiveHoverButton text="Sign in" />);
    expect(screen.getAllByText(/sign in/i).length).toBeGreaterThan(0);
  });

  it("shows loadingText when status='loading'", () => {
    render(
      <InteractiveHoverButton
        text="Sign in"
        loadingText="Signing in…"
        status="loading"
      />,
    );
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
  });

  it("shows successText when status='success'", () => {
    render(
      <InteractiveHoverButton
        text="Sign in"
        successText="Done!"
        status="success"
      />,
    );
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it("calls onClick when status='idle'", async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<InteractiveHoverButton text="Sign in" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /sign in/i }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("stays disabled while status !== idle", () => {
    render(<InteractiveHoverButton text="Sign in" status="loading" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("respects type='submit'", () => {
    render(<InteractiveHoverButton text="Sign in" type="submit" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
