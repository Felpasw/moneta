import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState } from "@/components/molecules/EmptyState";

describe("<EmptyState />", () => {
  it("renderiza title obrigatório com role=status", () => {
    render(<EmptyState title="No bank accounts yet" />);

    const region = screen.getByRole("status");
    expect(region).toHaveTextContent(/no bank accounts yet/i);
  });

  it("renderiza description quando passada", () => {
    render(
      <EmptyState
        title="No accounts"
        description="Ask Moneta to add your first account."
      />,
    );

    expect(
      screen.getByText(/ask moneta to add your first account/i),
    ).toBeInTheDocument();
  });

  it("renderiza action quando passada", () => {
    render(
      <EmptyState
        title="No accounts"
        action={<button type="button">Add account</button>}
      />,
    );

    expect(
      screen.getByRole("button", { name: /add account/i }),
    ).toBeInTheDocument();
  });

  it("renderiza icon quando passado", () => {
    render(
      <EmptyState
        title="Empty"
        icon={<span data-testid="empty-icon">?</span>}
      />,
    );

    expect(screen.getByTestId("empty-icon")).toBeInTheDocument();
  });

  it("omite description/action/icon quando não passados", () => {
    render(<EmptyState title="Just title" />);

    expect(screen.getByRole("status")).toHaveTextContent("Just title");
    expect(screen.queryByRole("button")).toBeNull();
  });
});
