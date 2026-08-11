import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const usePathnameMock = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import { SettingsHub } from "@/components/templates/SettingsHub";

const renderAt = (pathname: string) => {
  usePathnameMock.mockReturnValue(pathname);
  return render(<SettingsHub />);
};

describe("<SettingsHub />", () => {
  it("renderiza os 5 items com hrefs corretos", () => {
    renderAt("/settings");

    const profile = screen.getByRole("link", { name: /profile/i });
    const assistant = screen.getByRole("link", { name: /assistant/i });
    const security = screen.getByRole("link", { name: /security/i });
    const data = screen.getByRole("link", { name: /data/i });
    const about = screen.getByRole("link", { name: /about/i });

    expect(profile).toHaveAttribute("href", "/settings/profile");
    expect(assistant).toHaveAttribute("href", "/settings/assistant");
    expect(security).toHaveAttribute("href", "/settings/security");
    expect(data).toHaveAttribute("href", "/settings/data");
    expect(about).toHaveAttribute("href", "/settings/about");
  });

  it("marca aria-current=page no item ativo quando pathname bate", () => {
    renderAt("/settings/assistant");

    const assistant = screen.getByRole("link", { name: /assistant/i });
    expect(assistant).toHaveAttribute("aria-current", "page");

    const profile = screen.getByRole("link", { name: /profile/i });
    expect(profile).not.toHaveAttribute("aria-current");
  });

  it("marca ativo quando pathname é sub-caminho do item (ex: /settings/security/sessions)", () => {
    renderAt("/settings/security/sessions");

    const security = screen.getByRole("link", { name: /security/i });
    expect(security).toHaveAttribute("aria-current", "page");
  });

  it("no /settings raiz nenhum sub-item fica ativo", () => {
    renderAt("/settings");

    ["profile", "assistant", "security", "data", "about"].forEach((label) => {
      const link = screen.getByRole("link", { name: new RegExp(label, "i") });
      expect(link).not.toHaveAttribute("aria-current");
    });
  });
});
