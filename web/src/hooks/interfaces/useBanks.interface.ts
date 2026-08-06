import type { UseSuspenseQueryResult } from "@tanstack/react-query";

import type { Bank } from "@/services/interfaces/banks.interface";

export interface BanksHooksResult {
  list: UseSuspenseQueryResult<Bank[]>;
}

export interface IBanksHooks {
  use(): BanksHooksResult;
}
