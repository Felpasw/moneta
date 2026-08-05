import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import categoriesService from "@/services/categories.service";
import type { Category } from "@/services/interfaces/categories.interface";

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

  it("list — GET /categories", async () => {
    mockedGet.mockResolvedValueOnce({ data: [CATEGORY] });

    const result = await categoriesService.list();

    expect(mockedGet).toHaveBeenCalledWith("/categories");
    expect(result).toEqual([CATEGORY]);
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

  it("rename — PATCH /categories/:id com o novo nome", async () => {
    mockedPatch.mockResolvedValueOnce({ data: CATEGORY });

    const result = await categoriesService.rename("cat-1", {
      name: "Mercado",
    });

    expect(mockedPatch).toHaveBeenCalledWith("/categories/cat-1", {
      name: "Mercado",
    });
    expect(result).toEqual(CATEGORY);
  });

  it("remove — DELETE /categories/:id (204, sem body)", async () => {
    mockedDelete.mockResolvedValueOnce({ data: undefined });

    await categoriesService.remove("cat-1");

    expect(mockedDelete).toHaveBeenCalledWith("/categories/cat-1");
  });
});
