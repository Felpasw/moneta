/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `accountsHooks.use()` acontece durante
 * o render em ordem estável, então Rules of Hooks (runtime) segue respeitada.
 * Regra: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import accountsService from "@/services/accounts.service";
import type {
  AddBankAccountInput,
  UserBankAccount,
} from "@/services/interfaces/accounts.interface";

import type {
  AccountsHooksResult,
  IAccountsHooks,
  SetBalanceVariables,
  UpdateAccountVariables,
} from "./interfaces/useAccounts.interface";

export const ACCOUNTS_QUERY_KEYS = {
  all: ["accounts"] as const,
  list: ["accounts", "list"] as const,
};

class AccountsHooks implements IAccountsHooks {
  use(): AccountsHooksResult {
    const queryClient = useQueryClient();

    const invalidateList = () =>
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_QUERY_KEYS.list });

    const list = useQuery<UserBankAccount[]>({
      queryKey: ACCOUNTS_QUERY_KEYS.list,
      queryFn: () => accountsService.list(),
    });

    const create = useMutation<UserBankAccount, unknown, AddBankAccountInput>({
      mutationFn: (input) => accountsService.create(input),
      onSuccess: () => {
        void invalidateList();
      },
    });

    const update = useMutation<
      UserBankAccount,
      unknown,
      UpdateAccountVariables
    >({
      mutationFn: ({ id, patch }) => accountsService.update(id, patch),
      onSuccess: () => {
        void invalidateList();
      },
    });

    const remove = useMutation<void, unknown, string>({
      mutationFn: (id) => accountsService.remove(id),
      onSuccess: () => {
        void invalidateList();
      },
    });

    const setBalance = useMutation<
      UserBankAccount,
      unknown,
      SetBalanceVariables
    >({
      mutationFn: ({ id, patch }) => accountsService.setBalance(id, patch),
      onSuccess: () => {
        void invalidateList();
      },
    });

    return { list, create, update, remove, setBalance };
  }
}

const accountsHooks = new AccountsHooks();

export default accountsHooks;
