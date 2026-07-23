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
  it("renderiza label acessível e input controlado", () => {
    render(<ControlledHost />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("dispara onChange e atualiza o valor conforme o user digita", async () => {
    const user = userEvent.setup();
    render(<ControlledHost />);

    const input = screen.getByRole("textbox");
    await user.type(input, "foo@bar.com");

    expect(input).toHaveValue("foo@bar.com");
  });

  it("respeita `type` prop (ex: password vira input seguro sem role textbox)", () => {
    const { container } = render(<ControlledHost type="password" />);

    const input = container.querySelector("input");
    expect(input).not.toBeNull();
    expect(input).toHaveAttribute("type", "password");
  });

  it("mostra toggle de olho quando type='password' e showPasswordToggle=true", () => {
    const { container } = render(
      <AnimatedInput
        label="Senha"
        value="segredo123"
        type="password"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );

    const toggle = screen.getByRole("button", { name: /mostrar senha/i });
    expect(toggle).toBeInTheDocument();
    const input = container.querySelector("input");
    expect(input).toHaveAttribute("type", "password");
  });

  it("alterna type entre password e text ao clicar no olho", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AnimatedInput
        label="Senha"
        value="segredo123"
        type="password"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );

    const input = container.querySelector("input");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: /mostrar senha/i }));
    expect(input).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: /esconder senha/i }));
    expect(input).toHaveAttribute("type", "password");
  });

  it("não mostra toggle quando type !== password", () => {
    render(
      <AnimatedInput
        label="E-mail"
        value=""
        type="email"
        showPasswordToggle
        onChange={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: /mostrar senha/i })).toBeNull();
  });

  it("chama onFocus/onBlur do consumidor quando fornecidos", async () => {
    const onFocus = vi.fn();
    const onBlur = vi.fn();
    const user = userEvent.setup();

    render(
      <AnimatedInput
        label="Nome"
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
