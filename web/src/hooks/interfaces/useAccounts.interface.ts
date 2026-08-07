import type {
  UseMutationResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";

import type {
  AddBankAccountInput,
  ListAccountsResult,
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
  list: UseSuspenseQueryResult<ListAccountsResult>;
  create: UseMutationResult<UserBankAccount, unknown, AddBankAccountInput>;
  update: UseMutationResult<UserBankAccount, unknown, UpdateAccountVariables>;
  remove: UseMutationResult<void, unknown, string>;
  setBalance: UseMutationResult<UserBankAccount, unknown, SetBalanceVariables>;
}

export interface IAccountsHooks {
  use(): AccountsHooksResult;
}
