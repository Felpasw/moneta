import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Suspense, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/services/categories.service", () => ({
  default: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  },
}));

import { CategoriesScreen } from "@/components/templates/CategoriesScreen";
import categoriesService from "@/services/categories.service";
import type { CategoryWithUsage } from "@/services/interfaces/categories.interface";

const mockedService = vi.mocked(categoriesService);

const HOUSING: CategoryWithUsage = {
  id: "cat-home",
  userId: null,
  name: "Housing",
  icon: "🏠",
  color: null,
  monthlyBudget: 2000,
  spent: 1850,
  usagePct: 93,
  overBudget: false,
};

const FOOD_OVER: CategoryWithUsage = {
  id: "cat-food",
  userId: "u-1",
  name: "Food",
  icon: "🍔",
  color: null,
  monthlyBudget: 500,
  spent: 620,
  usagePct: 100,
  overBudget: true,
};

const SALARY_NO_BUDGET: CategoryWithUsage = {
  id: "cat-salary",
  userId: null,
  name: "Salary",
  icon: null,
  color: null,
  monthlyBudget: null,
  spent: 0,
  usagePct: 0,
  overBudget: false,
};

const renderScreen = (data: CategoryWithUsage[]) => {
  mockedService.list.mockResolvedValueOnce(data);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<div data-testid="suspense-fallback" />}>
        {children}
      </Suspense>
    </QueryClientProvider>
  );
  return render(
    <Wrapper>
      <CategoriesScreen />
    </Wrapper>,
  );
};

describe("<CategoriesScreen />", () => {
  it("mostra EmptyState quando lista é vazia", async () => {
    renderScreen([]);

    await waitFor(() =>
      expect(screen.getByText(/no categories yet/i)).toBeInTheDocument(),
    );
    expect(
      screen.queryByRole("region", { name: /categories list/i }),
    ).toBeNull();
  });

  it("renderiza cada categoria com name/spent/monthlyBudget direto do backend", async () => {
    renderScreen([HOUSING, FOOD_OVER, SALARY_NO_BUDGET]);

    await waitFor(() =>
      expect(screen.getByText("Housing")).toBeInTheDocument(),
    );
    expect(screen.getByText("Food")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText(/1,850\.00|1\.850,00/)).toBeInTheDocument();
    expect(screen.getByText(/no budget/i)).toBeInTheDocument();
  });

  it("marca overBudget quando backend sinaliza", async () => {
    renderScreen([FOOD_OVER]);

    await waitFor(() =>
      expect(screen.getByText("Food")).toBeInTheDocument(),
    );
    expect(screen.getByText(/over budget/i)).toBeInTheDocument();
  });

  it("renderiza usagePct vindo direto do backend", async () => {
    renderScreen([HOUSING]);

    await waitFor(() =>
      expect(screen.getByText("Housing")).toBeInTheDocument(),
    );
    expect(screen.getByText(/93% used/i)).toBeInTheDocument();
  });
});
