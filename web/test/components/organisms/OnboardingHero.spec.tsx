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
  it("renders orb, title and subtitle", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(screen.getByTestId("voice-orb")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /welcome to moneta/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/give your assistant a second to breathe/i),
    ).toBeInTheDocument();
  });

  it("shows BarLoader while isWarming=true", () => {
    render(<OnboardingHero {...baseProps} isWarming />);

    expect(
      screen.getByRole("status", { name: /connecting/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /turn on mic/i })).toBeNull();
  });

  it("shows MicButton when isWarming=false", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(
      screen.getByRole("button", { name: /turn on mic/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /connecting/i })).toBeNull();
  });

  it("clicking MicButton fires onMicToggle", async () => {
    const onMicToggle = vi.fn();
    const user = userEvent.setup();
    render(<OnboardingHero {...baseProps} onMicToggle={onMicToggle} />);

    await user.click(screen.getByRole("button", { name: /turn on mic/i }));
    expect(onMicToggle).toHaveBeenCalledTimes(1);
  });

  it("renders StepIndicator with onboarding labels when activeStep is passed", () => {
    render(<OnboardingHero {...baseProps} activeStep={0} />);

    for (const label of ["Nickname", "Banks", "Balances", "Settings", "Done"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("does not render StepIndicator when activeStep is undefined", () => {
    render(<OnboardingHero {...baseProps} />);

    expect(screen.queryByText("Nickname")).toBeNull();
    expect(screen.queryByText("Done")).toBeNull();
  });

  it("hides StepIndicator while isWarming (loader active)", () => {
    render(<OnboardingHero {...baseProps} isWarming activeStep={2} />);

    expect(screen.queryByText("Balances")).toBeNull();
  });
});
