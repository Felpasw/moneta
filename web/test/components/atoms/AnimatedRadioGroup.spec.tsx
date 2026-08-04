import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  AnimatedRadioGroup,
  type AnimatedRadioOption,
} from "@/components/atoms/AnimatedRadioGroup";

const OPTIONS: AnimatedRadioOption<"formal" | "informal" | "very_informal">[] = [
  {
    value: "formal",
    label: "Formal",
    accentClass: "text-blue-400 border-blue-400",
  },
  {
    value: "informal",
    label: "Informal",
    accentClass: "text-fuchsia-400 border-fuchsia-400",
  },
  {
    value: "very_informal",
    label: "Muito informal",
    accentClass: "text-emerald-400 border-emerald-400",
  },
];

describe("<AnimatedRadioGroup />", () => {
  it("renderiza cada option como radio acessível", () => {
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom de tratamento"
        options={OPTIONS}
        value="informal"
        onChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("radiogroup", { name: /tom de tratamento/i }),
    ).toBeInTheDocument();
    for (const opt of OPTIONS) {
      expect(screen.getByRole("radio", { name: opt.label })).toBeInTheDocument();
    }
  });

  it("marca como checked apenas o option cujo value bate com prop value", () => {
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="very_informal"
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("radio", { name: "Muito informal" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Formal" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Informal" })).not.toBeChecked();
  });

  it("dispara onChange com o value do option clicado", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="informal"
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("radio", { name: "Formal" }));

    expect(handleChange).toHaveBeenCalledWith("formal");
  });

  it("dispara onChange ao pressionar Enter ou Space no radio focado", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="formal"
        onChange={handleChange}
      />,
    );

    const informal = screen.getByRole("radio", { name: "Informal" });
    informal.focus();
    await user.keyboard(" ");

    expect(handleChange).toHaveBeenCalledWith("informal");
  });

  it("é somente-leitura semanticamente quando não fornecemos onChange (fallback opcional)", () => {
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="informal"
      />,
    );
    // Sem onChange, o click não pode quebrar; garantimos que renderiza.
    expect(screen.getByRole("radio", { name: "Informal" })).toBeChecked();
  });

  it("desabilita todos os radios e ignora clicks quando disabled=true", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="informal"
        onChange={handleChange}
        disabled
      />,
    );

    const formal = screen.getByRole("radio", { name: "Formal" });
    expect(formal).toBeDisabled();
    await user.click(formal);
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("respeita className extra no wrapper", () => {
    const { container } = render(
      <AnimatedRadioGroup
        name="tone"
        ariaLabel="Tom"
        options={OPTIONS}
        value="informal"
        onChange={vi.fn()}
        className="my-custom-class"
      />,
    );

    const wrapper = container.querySelector(".my-custom-class");
    expect(wrapper).not.toBeNull();
  });
});
