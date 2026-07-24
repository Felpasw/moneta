import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogOut, Truck } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/organisms/AppSidebar";

const user = {
  name: "Emma",
  email: "emma@nucleus-ui.com",
  avatarUrl: "https://example.test/avatar.jpg",
};

const navItems = [
  {
    label: "My orders",
    href: "#orders",
    icon: <Truck data-testid="orders-icon" className="h-full w-full" />,
  },
  {
    label: "Settings",
    href: "#settings",
    icon: <Truck data-testid="settings-icon" className="h-full w-full" />,
    isSeparator: true,
  },
];

const buildLogoutItem = (onClick = vi.fn()) => ({
  label: "Log out",
  icon: <LogOut data-testid="logout-icon" className="h-full w-full" />,
  onClick,
});

describe("<AppSidebar />", () => {
  it("renderiza avatar, nome e email do user", () => {
    render(
      <AppSidebar
        user={user}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
      />,
    );

    const avatar = screen.getByRole("img", { name: /emma's avatar/i });
    expect(avatar).toHaveAttribute("src", user.avatarUrl);
    expect(screen.getByText("Emma")).toBeInTheDocument();
    expect(screen.getByText("emma@nucleus-ui.com")).toBeInTheDocument();
  });

  it("renderiza cada nav item como link com href e label", () => {
    render(
      <AppSidebar
        user={user}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
      />,
    );

    const ordersLink = screen.getByRole("link", { name: /my orders/i });
    expect(ordersLink).toHaveAttribute("href", "#orders");

    const settingsLink = screen.getByRole("link", { name: /settings/i });
    expect(settingsLink).toHaveAttribute("href", "#settings");
  });

  it("expõe uma landmark aria-label 'User Profile Menu' e navegação semântica", () => {
    render(
      <AppSidebar
        user={user}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
      />,
    );

    expect(
      screen.getByRole("complementary", { name: /user profile menu/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("clicar no botão de logout dispara logoutItem.onClick", async () => {
    const onLogout = vi.fn();
    const userEvt = userEvent.setup();
    render(
      <AppSidebar
        user={user}
        navItems={navItems}
        logoutItem={buildLogoutItem(onLogout)}
      />,
    );

    await userEvt.click(screen.getByRole("button", { name: /log out/i }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("sem avatarUrl, renderiza fallback com iniciais do nome no lugar do <img>", () => {
    render(
      <AppSidebar
        user={{ name: "Felipe Cavalcante", email: "f@moneta.dev" }}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByText("FC")).toBeInTheDocument();
  });

  it("fallback usa apenas a primeira letra quando o nome é single word", () => {
    render(
      <AppSidebar
        user={{ name: "Emma", email: "emma@x.com" }}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
      />,
    );

    expect(screen.getByText("E")).toBeInTheDocument();
  });

  it("aplica className extra quando passado", () => {
    render(
      <AppSidebar
        user={user}
        navItems={navItems}
        logoutItem={buildLogoutItem()}
        className="test-extra-class"
      />,
    );

    const aside = screen.getByRole("complementary", {
      name: /user profile menu/i,
    });
    expect(aside).toHaveClass("test-extra-class");
  });
});
