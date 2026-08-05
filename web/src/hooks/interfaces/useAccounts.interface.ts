import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  AddBankAccountInput,
  SetBalanceInput,
  UpdateBankAccountInput,
  UserBankAccount,
} from "@/services/interfaces/accounts.interface";

export interface UpdateAccountVariables {
  id: string;
  patch: UpdateBankAccountInput;
}

export interface SetBalanceVariables {
  id: string;
  patch: SetBalanceInput;
}

export interface AccountsHooksResult {
  list: UseQueryResult<UserBankAccount[]>;
  create: UseMutationResult<UserBankAccount, unknown, AddBankAccountInput>;
  update: UseMutationResult<UserBankAccount, unknown, UpdateAccountVariables>;
  remove: UseMutationResult<void, unknown, string>;
  setBalance: UseMutationResult<UserBankAccount, unknown, SetBalanceVariables>;
}

export interface IAccountsHooks {
  use(): AccountsHooksResult;
}
