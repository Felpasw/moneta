import type { UseQueryResult } from "@tanstack/react-query";

import type { Bank } from "@/services/interfaces/banks.interface";

export interface BanksHooksResult {
  list: UseQueryResult<Bank[]>;
}

export interface IBanksHooks {
  use(): BanksHooksResult;
}
