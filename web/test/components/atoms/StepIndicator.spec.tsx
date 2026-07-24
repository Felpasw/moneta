import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StepIndicator } from "@/components/atoms/StepIndicator";

const STEPS = ["Apelido", "Bancos", "Saldos", "Ajustes", "Pronto"];

describe("StepIndicator", () => {
  it("renderiza todos os labels de step", () => {
    render(<StepIndicator steps={STEPS} activeIndex={0} />);

    for (const label of STEPS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marca a etapa ativa com aria-current=step", () => {
    render(<StepIndicator steps={STEPS} activeIndex={2} />);

    const list = screen.getByRole("list", { name: /progresso/i });
    const items = list.querySelectorAll("li");
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[0].getAttribute("aria-current")).toBeNull();
  });

  it("bolinhas dos steps passados ficam clicáveis quando onStepClick é passado", async () => {
    const onStepClick = vi.fn();
    render(
      <StepIndicator steps={STEPS} activeIndex={3} onStepClick={onStepClick} />,
    );

    const pastStep = screen.getByRole("button", { name: /Etapa 1: Apelido/ });
    expect(pastStep).not.toBeDisabled();

    await userEvent.click(pastStep);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("bolinha da etapa atual e futuras ficam disabled", () => {
    const onStepClick = vi.fn();
    render(
      <StepIndicator steps={STEPS} activeIndex={2} onStepClick={onStepClick} />,
    );

    expect(
      screen.getByRole("button", { name: /Etapa 3: Saldos/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Etapa 4: Ajustes/ }),
    ).toBeDisabled();
  });

  it("sem onStepClick, nenhuma bolinha é clicável", () => {
    render(<StepIndicator steps={STEPS} activeIndex={4} />);

    for (const label of STEPS) {
      const index = STEPS.indexOf(label);
      const button = screen.getByRole("button", {
        name: new RegExp(`Etapa ${index + 1}: ${label}`),
      });
      expect(button).toBeDisabled();
    }
  });

  it("clampa activeIndex acima do último step sem crashar", () => {
    render(<StepIndicator steps={STEPS} activeIndex={99} />);

    const list = screen.getByRole("list", { name: /progresso/i });
    expect(list).toBeInTheDocument();
  });

  it("clampa activeIndex negativo tratando como zero", () => {
    render(<StepIndicator steps={STEPS} activeIndex={-3} />);

    const list = screen.getByRole("list", { name: /progresso/i });
    const items = list.querySelectorAll("li");
    expect(items[0].getAttribute("aria-current")).toBe("step");
  });

  it("mostra o número da etapa quando ainda é current/future", () => {
    render(<StepIndicator steps={STEPS} activeIndex={1} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
