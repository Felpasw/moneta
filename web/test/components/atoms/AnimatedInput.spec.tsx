import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { AnimatedInput } from "@/components/atoms/AnimatedInput";

function ControlledHost({ initial = "", type }: { initial?: string; type?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <AnimatedInput
      label="Email Address"
      value={value}
      type={type}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}

describe("<AnimatedInput />", () => {
  it("renders accessible label and controlled input", () => {
    render(<ControlledHost />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("fires onChange and updates the value as the user types", async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);

    const input = screen.getByRole("textbox");
    await user.type(input, "foo@bar.com");

    expect(input).toHaveValue("foo@bar.com");
  });

  it("respects the `type` prop (e.g. password becomes a secure input without textbox role)", () => {
    const { container } = render(<ControlledHost type="password" />);

    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("type", "password");
  });

  it("shows an eye toggle when type='password' and showPasswordToggle=true", () => {
    const { container } = render(
      <AnimatedInput
        label="Password"
        value="segredo123"
        type="password"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );

    const toggle = screen.getByRole("button", { name: /show password/i });
    expect(toggle).toBeInTheDocument();
    const input = container.querySelector("input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("switches type between password and text when clicking the eye", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AnimatedInput
        label="Password"
        value="segredo123"
        type="password"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );

    const input = container.querySelector("input");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("does not show the toggle when type !== password", () => {
    render(
      <AnimatedInput
        label="Email"
        value=""
        type="email"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /show password/i })).toBeNull();
  });

  it("calls the consumer's onFocus/onBlur when provided", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const user = userEvent.setup();

    render(
      <AnimatedInput
        label="Name"
        value=""
        onChange={() => undefined}
        onFocus={onFocus}
        onBlur={onBlur}
      />,
    );

    const input = screen.getByRole("textbox");
    await user.click(input);
    expect(onFocus).toHaveBeenCalledTimes(1);

    await user.tab();
    expect(onBlur).toHaveBeenCalledTimes(1);
  });
});
