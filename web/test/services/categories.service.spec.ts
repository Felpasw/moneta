import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import categoriesService from "@/services/categories.service";
import type {
  Category,
  CategoryWithUsage,
} from "@/services/interfaces/categories.interface";

vi.mock("@/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);
const mockedPost = vi.mocked(api.post);
const mockedPatch = vi.mocked(api.patch);
const mockedDelete = vi.mocked(api.delete);

const CATEGORY: Category = {
  id: "cat-1",
  userId: "u-1",
  name: "Groceries",
  icon: "🛒",
  color: "#22c55e",
  monthlyBudget: 1200,
};

const CATEGORY_WITH_USAGE: CategoryWithUsage = {
  ...CATEGORY,
  spent: 422.12,
  usagePct: 35,
  overBudget: false,
};

describe("categoriesService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — GET /categories devolve CategoryWithUsage[]", async () => {
    mockedGet.mockResolvedValueOnce({ data: [CATEGORY_WITH_USAGE] });

    const result = await categoriesService.list();

    expect(mockedGet).toHaveBeenCalledWith("/categories");
    expect(result).toEqual([CATEGORY_WITH_USAGE]);
  });

  it("create — POST /categories com o input", async () => {
    mockedPost.mockResolvedValueOnce({ data: CATEGORY });

    const result = await categoriesService.create({
      name: "Groceries",
      icon: "🛒",
    });

    expect(mockedPost).toHaveBeenCalledWith("/categories", {
      name: "Groceries",
      icon: "🛒",
    });
    expect(result).toEqual(CATEGORY);
  });

  it("update — PATCH /categories/:id com patch parcial", async () => {
    mockedPatch.mockResolvedValueOnce({ data: CATEGORY });

    const result = await categoriesService.update("cat-1", {
      name: "Mercado",
      monthlyBudget: 1500,
    });

    expect(mockedPatch).toHaveBeenCalledWith("/categories/cat-1", {
      name: "Mercado",
      monthlyBudget: 1500,
    });
    expect(result).toEqual(CATEGORY);
  });

  it("update — PATCH aceita monthlyBudget null pra limpar", async () => {
    mockedPatch.mockResolvedValueOnce({ data: CATEGORY });

    await categoriesService.update("cat-1", { monthlyBudget: null });

    expect(mockedPatch).toHaveBeenCalledWith("/categories/cat-1", {
      monthlyBudget: null,
    });
  });

  it("remove — DELETE /categories/:id (204, sem body)", async () => {
    mockedDelete.mockResolvedValueOnce({ data: undefined });

    await categoriesService.remove("cat-1");

    expect(mockedDelete).toHaveBeenCalledWith("/categories/cat-1");
  });
});
