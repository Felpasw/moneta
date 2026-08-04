import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssistantSettingsTreatmentStyle } from "@/components/organisms/AssistantSettingsTreatmentStyle";
import { TREATMENT_STYLE_OPTIONS } from "@/components/organisms/assistantSettings.constants";

describe("AssistantSettingsTreatmentStyle", () => {
  it("renderiza as 3 opções (Formal, Informal, Muito informal)", () => {
    render(
      <AssistantSettingsTreatmentStyle value="informal" onChange={vi.fn()} />,
    );

    for (const option of TREATMENT_STYLE_OPTIONS) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    }
  });

  it("renderiza o exemplo de fala embaixo de cada opção", () => {
    render(
      <AssistantSettingsTreatmentStyle value="informal" onChange={vi.fn()} />,
    );

    for (const option of TREATMENT_STYLE_OPTIONS) {
      expect(
        screen.getByText((text) => text.includes(option.example)),
      ).toBeInTheDocument();
    }
  });

  it("marca como checked apenas o radio correspondente ao value atual", () => {
    render(
      <AssistantSettingsTreatmentStyle value="formal" onChange={vi.fn()} />,
    );

    expect(screen.getByRole("radio", { name: "Formal" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Informal" })).not.toBeChecked();
    expect(
      screen.getByRole("radio", { name: "Muito informal" }),
    ).not.toBeChecked();
  });

  it("dispara onChange com o novo value quando outra opção é clicada", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsTreatmentStyle
        value="informal"
        onChange={onChange}
      />,
    );

    const veryInformalRadio = screen.getByRole("radio", {
      name: "Muito informal",
    });
    await userEvent.click(veryInformalRadio);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("very_informal");
  });

  it("não dispara onChange ao clicar na opção já selecionada", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsTreatmentStyle
        value="informal"
        onChange={onChange}
      />,
    );

    const informalRadio = screen.getByRole("radio", { name: "Informal" });
    await userEvent.click(informalRadio);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("respeita a prop disabled — bloqueia interação", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsTreatmentStyle
        value="informal"
        onChange={onChange}
        disabled
      />,
    );

    const formalRadio = screen.getByRole("radio", { name: "Formal" });
    await userEvent.click(formalRadio);

    expect(onChange).not.toHaveBeenCalled();
  });
});
