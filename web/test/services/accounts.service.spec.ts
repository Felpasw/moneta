import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";
import accountsService from "@/services/accounts.service";
import type { UserBankAccount } from "@/services/interfaces/accounts.interface";

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

const ACCOUNT: UserBankAccount = {
  id: "acc-1",
  userId: "u-1",
  bankId: "b-1",
  nickname: "Main",
  balance: 100,
  creditLimit: null,
  overdraftLimit: 500,
  closeDay: null,
  dueDay: null,
};

describe("accountsService", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("list — GET /accounts", async () => {
    mockedGet.mockResolvedValueOnce({ data: [ACCOUNT] });

    const result = await accountsService.list();

    expect(mockedGet).toHaveBeenCalledWith("/accounts");
    expect(result).toEqual([ACCOUNT]);
  });

  it("create — POST /accounts com o input", async () => {
    mockedPost.mockResolvedValueOnce({ data: ACCOUNT });
    const input = { bankId: "b-1", nickname: "Main", initialBalance: 100 };

    const result = await accountsService.create(input);

    expect(mockedPost).toHaveBeenCalledWith("/accounts", input);
    expect(result).toEqual(ACCOUNT);
  });

  it("update — PATCH /accounts/:id com o patch", async () => {
    mockedPatch.mockResolvedValueOnce({ data: ACCOUNT });
    const patch = { nickname: "Novo apelido" };

    const result = await accountsService.update("acc-1", patch);

    expect(mockedPatch).toHaveBeenCalledWith("/accounts/acc-1", patch);
    expect(result).toEqual(ACCOUNT);
  });

  it("remove — DELETE /accounts/:id (204, sem body)", async () => {
    mockedDelete.mockResolvedValueOnce({ data: undefined });

    await accountsService.remove("acc-1");

    expect(mockedDelete).toHaveBeenCalledWith("/accounts/acc-1");
  });

  it("setBalance — POST /accounts/:id/balance com o amount", async () => {
    mockedPost.mockResolvedValueOnce({ data: ACCOUNT });

    const result = await accountsService.setBalance("acc-1", { amount: 250 });

    expect(mockedPost).toHaveBeenCalledWith("/accounts/acc-1/balance", {
      amount: 250,
    });
    expect(result).toEqual(ACCOUNT);
  });

  it("propaga erro do axios em qualquer método", async () => {
    const error = { response: { status: 500 } };
    mockedGet.mockRejectedValueOnce(error);

    await expect(accountsService.list()).rejects.toEqual(error);
  });
});
