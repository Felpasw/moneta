import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import banksService from "@/services/banks.service";
import type { Bank } from "@/services/interfaces/banks.interface";

vi.mock("@/api", () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(api.get);

const BANKS: Bank[] = [
  { id: "b1", name: "Nubank", compeCode: "260", logoUrl: null },
  { id: "b2", name: "Itaú Unibanco", compeCode: "341", logoUrl: "https://cdn/itau.svg" },
];

describe("banksService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("GET /banks retorna o catálogo", async () => {
      mockedGet.mockResolvedValueOnce({ data: BANKS });

      const result = await banksService.list();

      expect(mockedGet).toHaveBeenCalledWith("/banks");
      expect(result).toEqual(BANKS);
    });

    it("propaga o erro do axios", async () => {
      const error = { response: { status: 500 } };
      mockedGet.mockRejectedValueOnce(error);

      await expect(banksService.list()).rejects.toEqual(error);
    });
  });
});
