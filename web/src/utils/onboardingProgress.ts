import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import { ToolEventKind } from "@/hooks/constants/useAgentSession.constants";

export const ONBOARDING_STEP_LABELS = [
  "Apelido",
  "Bancos",
  "Saldos",
  "Ajustes",
  "Pronto",
] as const;

export const ONBOARDING_TOOL_STEP: Record<string, number> = {
  set_nickname: 1,
  add_user_banks: 2,
  set_account_balances: 3,
  configure_account_details: 4,
  complete_onboarding: 4,
};

export interface OnboardingBankExtras {
  creditLimit?: number;
  closeDay?: number;
  dueDay?: number;
  overdraftLimit?: number;
}

export interface OnboardingBank extends OnboardingBankExtras {
  accountId: string;
  bankName: string;
  balance?: number;
}

export interface OnboardingSummary {
  nickname: string | null;
  banks: OnboardingBank[];
  isComplete: boolean;
}

interface AddUserBanksResult {
  created?: Array<{ accountId?: string; bankName?: string }>;
}

interface SetBalancesResult {
  updated?: Array<{ accountId?: string; balance?: number }>;
}

interface SetNicknameResult {
  nickname?: string;
}

interface CompleteOnboardingResult {
  ok?: boolean;
}

interface ConfigureAccountDetailsArgs {
  accounts?: Array<{
    accountId?: string;
    creditLimit?: number;
    closeDay?: number;
    dueDay?: number;
    overdraftLimit?: number;
  }>;
}

const toolNameByCallId = (events: readonly ToolEvent[]): Map<string, string> => {
  const map = new Map<string, string>();
  for (const event of events) {
    if (event.kind === ToolEventKind.Pending && event.toolName) {
      map.set(event.callId, event.toolName);
    }
  }
  return map;
};

export const deriveActiveStep = (events: readonly ToolEvent[]): number => {
  const names = toolNameByCallId(events);
  let index = 0;
  for (const event of events) {
    if (event.kind !== ToolEventKind.Result) continue;
    const toolName = names.get(event.callId);
    if (!toolName) continue;
    const next = ONBOARDING_TOOL_STEP[toolName];
    if (next !== undefined && next > index) index = next;
  }
  return index;
};

const collectConfigureExtras = (
  events: readonly ToolEvent[],
  names: Map<string, string>,
): Map<string, OnboardingBankExtras> => {
  const extras = new Map<string, OnboardingBankExtras>();
  const successCallIds = new Set<string>();

  for (const event of events) {
    if (event.kind !== ToolEventKind.Result) continue;
    if (names.get(event.callId) === "configure_account_details") {
      successCallIds.add(event.callId);
    }
  }

  for (const event of events) {
    if (event.kind !== ToolEventKind.Pending) continue;
    if (event.toolName !== "configure_account_details") continue;
    if (!successCallIds.has(event.callId)) continue;
    const args = event.args as ConfigureAccountDetailsArgs | undefined;
    for (const patch of args?.accounts ?? []) {
      if (!patch.accountId) continue;
      const current = extras.get(patch.accountId) ?? {};
      extras.set(patch.accountId, {
        creditLimit: patch.creditLimit ?? current.creditLimit,
        closeDay: patch.closeDay ?? current.closeDay,
        dueDay: patch.dueDay ?? current.dueDay,
        overdraftLimit: patch.overdraftLimit ?? current.overdraftLimit,
      });
    }
  }

  return extras;
};

export const buildOnboardingSummary = (
  events: readonly ToolEvent[],
): OnboardingSummary => {
  const names = toolNameByCallId(events);
  const summary: OnboardingSummary = {
    nickname: null,
    banks: [],
    isComplete: false,
  };
  const balanceByAccount = new Map<string, number>();
  const extrasByAccount = collectConfigureExtras(events, names);

  for (const event of events) {
    if (event.kind !== ToolEventKind.Result) continue;
    const toolName = names.get(event.callId);
    if (!toolName) continue;

    if (toolName === "set_nickname") {
      const result = event.result as SetNicknameResult | undefined;
      if (result?.nickname) summary.nickname = result.nickname;
    }
    if (toolName === "add_user_banks") {
      const result = event.result as AddUserBanksResult | undefined;
      summary.banks = (result?.created ?? [])
        .filter((c): c is { accountId: string; bankName: string } =>
          Boolean(c.accountId && c.bankName),
        )
        .map((c) => ({ accountId: c.accountId, bankName: c.bankName }));
    }
    if (toolName === "set_account_balances") {
      const result = event.result as SetBalancesResult | undefined;
      for (const upd of result?.updated ?? []) {
        if (upd.accountId && typeof upd.balance === "number") {
          balanceByAccount.set(upd.accountId, upd.balance);
        }
      }
    }
    if (toolName === "complete_onboarding") {
      const result = event.result as CompleteOnboardingResult | undefined;
      if (result?.ok) summary.isComplete = true;
    }
  }

  summary.banks = summary.banks.map((bank) => ({
    ...bank,
    balance: balanceByAccount.get(bank.accountId),
    ...(extrasByAccount.get(bank.accountId) ?? {}),
  }));

  return summary;
};
