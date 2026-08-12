import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssistantSettingsLanguage } from "@/components/organisms/AssistantSettingsLanguage";
import { OUTPUT_LANGUAGE_OPTIONS } from "@/components/organisms/assistantSettings.constants";

describe("AssistantSettingsLanguage", () => {
  it("renders every OutputLanguage option (Português, English)", () => {
    render(<AssistantSettingsLanguage value="pt_BR" onChange={vi.fn()} />);

    for (const option of OUTPUT_LANGUAGE_OPTIONS) {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    }
  });

  it("shows the description under each option", () => {
    render(<AssistantSettingsLanguage value="pt_BR" onChange={vi.fn()} />);

    for (const option of OUTPUT_LANGUAGE_OPTIONS) {
      expect(
        screen.getByText((text) => text.includes(option.description)),
      ).toBeInTheDocument();
    }
  });

  it("marks the current language as checked", () => {
    render(<AssistantSettingsLanguage value="en_US" onChange={vi.fn()} />);

    expect(
      screen.getByRole("radio", { name: /english/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("radio", { name: /portugu/i }),
    ).not.toBeChecked();
  });

  it("fires onChange with the new value when another option is clicked", async () => {
    const onChange = vi.fn();
    render(<AssistantSettingsLanguage value="pt_BR" onChange={onChange} />);

    const englishRadio = screen.getByRole("radio", { name: /english/i });
    await userEvent.click(englishRadio);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith("en_US");
  });

  it("does not fire onChange when the selected option is clicked again", async () => {
    const onChange = vi.fn();
    render(<AssistantSettingsLanguage value="pt_BR" onChange={onChange} />);

    const portugueseRadio = screen.getByRole("radio", { name: /portugu/i });
    await userEvent.click(portugueseRadio);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("blocks interaction when disabled", async () => {
    const onChange = vi.fn();
    render(
      <AssistantSettingsLanguage value="pt_BR" onChange={onChange} disabled />,
    );

    const englishRadio = screen.getByRole("radio", { name: /english/i });
    await userEvent.click(englishRadio);

    expect(onChange).not.toHaveBeenCalled();
  });
});
