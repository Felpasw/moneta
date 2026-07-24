import { describe, expect, it } from "vitest";

import { ToolEventKind } from "@/hooks/constants/useAgentSession.constants";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import {
  buildOnboardingSummary,
  deriveActiveStep,
} from "@/utils/onboardingProgress";

const pending = (
  callId: string,
  toolName: string,
  args: Record<string, unknown> = {},
): ToolEvent => ({
  kind: ToolEventKind.Pending,
  callId,
  toolName,
  args,
});

const result = (callId: string, data: unknown): ToolEvent => ({
  kind: ToolEventKind.Result,
  callId,
  result: data,
});

describe("deriveActiveStep()", () => {
  it("retorna 0 quando não há tools completadas", () => {
    expect(deriveActiveStep([])).toBe(0);
  });

  it("avança pra 1 quando set_nickname resolve", () => {
    expect(
      deriveActiveStep([
        pending("c1", "set_nickname"),
        result("c1", { nickname: "Felps" }),
      ]),
    ).toBe(1);
  });

  it("avança pra 2 quando add_user_banks resolve", () => {
    expect(
      deriveActiveStep([
        pending("c1", "set_nickname"),
        result("c1", { nickname: "F" }),
        pending("c2", "add_user_banks"),
        result("c2", { created: [] }),
      ]),
    ).toBe(2);
  });

  it("nunca retrocede: results fora de ordem preservam o maior step", () => {
    expect(
      deriveActiveStep([
        pending("c1", "add_user_banks"),
        result("c1", {}),
        pending("c2", "set_nickname"),
        result("c2", {}),
      ]),
    ).toBe(2);
  });

  it("ignora results sem pending prévio (sem toolName associado)", () => {
    expect(deriveActiveStep([result("ghost", { nickname: "F" })])).toBe(0);
  });

  it("ignora tools desconhecidas", () => {
    expect(
      deriveActiveStep([
        pending("c1", "list_banks"),
        result("c1", []),
      ]),
    ).toBe(0);
  });

  it("configure_account_details e complete_onboarding ambos avançam pra 4", () => {
    expect(
      deriveActiveStep([
        pending("c1", "configure_account_details"),
        result("c1", { updated: [] }),
      ]),
    ).toBe(4);
    expect(
      deriveActiveStep([
        pending("c1", "complete_onboarding"),
        result("c1", { ok: true }),
      ]),
    ).toBe(4);
  });
});

describe("buildOnboardingSummary()", () => {
  it("captura nickname do set_nickname result", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "set_nickname"),
      result("c1", { nickname: "Felps" }),
    ]);
    expect(summary.nickname).toBe("Felps");
  });

  it("captura banks do add_user_banks e correlaciona balances", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "add_user_banks"),
      result("c1", {
        created: [
          { accountId: "acc-1", bankName: "Nubank" },
          { accountId: "acc-2", bankName: "PicPay" },
        ],
      }),
      pending("c2", "set_account_balances"),
      result("c2", {
        updated: [
          { accountId: "acc-1", balance: 5000 },
          { accountId: "acc-2", balance: 500 },
        ],
      }),
    ]);

    expect(summary.banks).toEqual([
      { accountId: "acc-1", bankName: "Nubank", balance: 5000 },
      { accountId: "acc-2", bankName: "PicPay", balance: 500 },
    ]);
  });

  it("banks sem balance associado ficam com balance undefined", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "add_user_banks"),
      result("c1", { created: [{ accountId: "acc-1", bankName: "Nubank" }] }),
    ]);
    expect(summary.banks[0].balance).toBeUndefined();
  });

  it("expande banks com creditLimit/closeDay/dueDay/overdraftLimit vindos do configure_account_details", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "add_user_banks"),
      result("c1", {
        created: [
          { accountId: "acc-nubank", bankName: "Nubank" },
          { accountId: "acc-picpay", bankName: "PicPay" },
        ],
      }),
      pending("c2", "configure_account_details", {
        accounts: [
          {
            accountId: "acc-nubank",
            creditLimit: 7000,
            closeDay: 15,
            dueDay: 22,
            overdraftLimit: 500,
          },
          { accountId: "acc-picpay", overdraftLimit: 100 },
        ],
      }),
      result("c2", { updated: [{ accountId: "acc-nubank" }, { accountId: "acc-picpay" }] }),
    ]);

    expect(summary.banks[0]).toEqual({
      accountId: "acc-nubank",
      bankName: "Nubank",
      balance: undefined,
      creditLimit: 7000,
      closeDay: 15,
      dueDay: 22,
      overdraftLimit: 500,
    });
    expect(summary.banks[1]).toMatchObject({
      accountId: "acc-picpay",
      overdraftLimit: 100,
    });
    expect(summary.banks[1].creditLimit).toBeUndefined();
  });

  it("ignora configure_account_details que ainda não teve result (só pending)", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "add_user_banks"),
      result("c1", {
        created: [{ accountId: "acc-1", bankName: "Nubank" }],
      }),
      pending("c2", "configure_account_details", {
        accounts: [{ accountId: "acc-1", overdraftLimit: 200 }],
      }),
    ]);

    expect(summary.banks[0].overdraftLimit).toBeUndefined();
  });

  it("isComplete=true só quando complete_onboarding retorna ok:true", () => {
    const withoutOk = buildOnboardingSummary([
      pending("c1", "complete_onboarding"),
      result("c1", { ok: false, missing: ["nickname"] }),
    ]);
    expect(withoutOk.isComplete).toBe(false);

    const withOk = buildOnboardingSummary([
      pending("c1", "complete_onboarding"),
      result("c1", { ok: true }),
    ]);
    expect(withOk.isComplete).toBe(true);
  });

  it("descarta entradas de created sem accountId ou bankName", () => {
    const summary = buildOnboardingSummary([
      pending("c1", "add_user_banks"),
      result("c1", {
        created: [
          { accountId: "acc-1", bankName: "Nubank" },
          { accountId: null, bankName: "Fantasma" },
          { accountId: "acc-2" },
        ],
      }),
    ]);
    expect(summary.banks).toHaveLength(1);
    expect(summary.banks[0].bankName).toBe("Nubank");
  });
});
