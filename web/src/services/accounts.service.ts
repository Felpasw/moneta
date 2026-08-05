import api from "@/api";

import type {
  AddBankAccountInput,
  IAccountsService,
  SetBalanceInput,
  UpdateBankAccountInput,
  UserBankAccount,
} from "./interfaces/accounts.interface";

class AccountsService implements IAccountsService {
  async list(): Promise<UserBankAccount[]> {
    const { data } = await api.get<UserBankAccount[]>("/accounts");

    return data;
  }

  async create(input: AddBankAccountInput): Promise<UserBankAccount> {
    const { data } = await api.post<UserBankAccount>("/accounts", input);

    return data;
  }

  async update(
    id: string,
    patch: UpdateBankAccountInput,
  ): Promise<UserBankAccount> {
    const { data } = await api.patch<UserBankAccount>(`/accounts/${id}`, patch);

    return data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/accounts/${id}`);
  }

  async setBalance(
    id: string,
    patch: SetBalanceInput,
  ): Promise<UserBankAccount> {
    const { data } = await api.post<UserBankAccount>(
      `/accounts/${id}/balance`,
      patch,
    );

    return data;
  }
}

const accountsService = new AccountsService();

export default accountsService;
