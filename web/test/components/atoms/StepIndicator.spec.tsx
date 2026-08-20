import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { StepIndicator } from "@/components/atoms/StepIndicator";

const STEPS = ["Nickname", "Banks", "Balances", "Settings", "Done"];

describe("StepIndicator", () => {
  it("renders every step label", () => {
    render(<StepIndicator steps={STEPS} activeIndex={0} />);

    for (const label of STEPS) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the active step with aria-current=step", () => {
    render(<StepIndicator steps={STEPS} activeIndex={2} />);

    const list = screen.getByRole("list", { name: /progress/i });
    const items = list.querySelectorAll("li");
    expect(items[2].getAttribute("aria-current")).toBe("step");
    expect(items[0].getAttribute("aria-current")).toBeNull();
  });

  it("past step dots become clickable when onStepClick is provided", async () => {
    const onStepClick = vi.fn();
    render(
      <StepIndicator steps={STEPS} activeIndex={3} onStepClick={onStepClick} />,
    );

    const pastStep = screen.getByRole("button", { name: /Step 1: Nickname/ });
    expect(pastStep).not.toBeDisabled();

    await userEvent.click(pastStep);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });

  it("current and future dots stay disabled", () => {
    const onStepClick = vi.fn();
    render(
      <StepIndicator steps={STEPS} activeIndex={2} onStepClick={onStepClick} />,
    );

    expect(
      screen.getByRole("button", { name: /Step 3: Balances/ }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /Step 4: Settings/ }),
    ).toBeDisabled();
  });

  it("without onStepClick, no dot is clickable", () => {
    render(<StepIndicator steps={STEPS} activeIndex={4} />);

    for (const label of STEPS) {
      const index = STEPS.indexOf(label);
      const button = screen.getByRole("button", {
        name: new RegExp(`Step ${index + 1}: ${label}`),
      });
      expect(button).toBeDisabled();
    }
  });

  it("clamps activeIndex above the last step without crashing", () => {
    render(<StepIndicator steps={STEPS} activeIndex={99} />);

    const list = screen.getByRole("list", { name: /progress/i });
    expect(list).toBeInTheDocument();
  });

  it("clamps negative activeIndex to zero", () => {
    render(<StepIndicator steps={STEPS} activeIndex={-3} />);

    const list = screen.getByRole("list", { name: /progress/i });
    const items = list.querySelectorAll("li");
    expect(items[0].getAttribute("aria-current")).toBe("step");
  });

  it("shows the step number when it is still current/future", () => {
    render(<StepIndicator steps={STEPS} activeIndex={1} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
