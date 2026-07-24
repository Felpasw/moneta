import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { OnboardingHero } from "@/components/organisms/OnboardingHero";
import { MicState } from "@/hooks/useAgentSession";

vi.mock("@/components/atoms/VoiceOrb", () => ({
  VoiceOrb: () => <div data-testid="voice-orb" />,
}));

const baseProps = {
  audioElement: null,
  micStream: null,
  micState: MicState.Off,
  isWarming: false,
  onMicToggle: () => undefined,
};

describe("<OnboardingHero />", () => {
  it("renderiza orb, título e subtítulo", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(screen.getByTestId("voice-orb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /bem-vindo à moneta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/toma um segundo pro seu assistente respirar/i),
    ).toBeInTheDocument();
  });

  it("mostra BarLoader enquanto isWarming=true", () => {
    render(<OnboardingHero {...baseProps} isWarming />);

    expect(
      screen.getByRole("status", { name: /conectando/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /ligar mic/i })).toBeNull();
  });

  it("mostra MicButton quando isWarming=false", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(
      screen.getByRole("button", { name: /ligar mic/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /conectando/i })).toBeNull();
  });

  it("clicar em MicButton dispara onMicToggle", async () => {
    const onMicToggle = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingHero {...baseProps} onMicToggle={onMicToggle} />);

    await user.click(screen.getByRole("button", { name: /ligar mic/i }));
    expect(onMicToggle).toHaveBeenCalledTimes(1);
  });

  it("renderiza StepIndicator com labels do onboarding quando activeStep é passado", () => {
    render(<OnboardingHero {...baseProps} activeStep={0} />);

    for (const label of ["Apelido", "Bancos", "Saldos", "Ajustes", "Pronto"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("não renderiza StepIndicator quando activeStep é undefined", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(screen.queryByText("Apelido")).toBeNull();
    expect(screen.queryByText("Pronto")).toBeNull();
  });

  it("esconde StepIndicator enquanto isWarming (loader ativo)", () => {
    render(<OnboardingHero {...baseProps} isWarming activeStep={2} />);

    expect(screen.queryByText("Saldos")).toBeNull();
  });
});
