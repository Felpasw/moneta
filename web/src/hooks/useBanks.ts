/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `banksHooks.use()` acontece durante o
 * render em ordem estável, então Rules of Hooks (runtime) segue respeitada.
 * Regra: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop.
 */

import { useSuspenseQuery } from "@tanstack/react-query";

import banksService from "@/services/banks.service";
import type { Bank } from "@/services/interfaces/banks.interface";

import type {
  BanksHooksResult,
  IBanksHooks,
} from "./interfaces/useBanks.interface";

export const BANKS_QUERY_KEYS = {
  all: ["banks"] as const,
  list: ["banks", "list"] as const,
};

class BanksHooks implements IBanksHooks {
  use(): BanksHooksResult {
    const list = useSuspenseQuery<Bank[]>({
      queryKey: BANKS_QUERY_KEYS.list,
      queryFn: () => banksService.list(),
    });

    return { list };
  }
}

const banksHooks = new BanksHooks();

export default banksHooks;
