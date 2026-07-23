import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingProgress } from "@/components/organisms/OnboardingProgress";
import { ToolEventKind } from "@/hooks/constants/useAgentSession.constants";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";

const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
}));

const pending = (callId: string, toolName: string): ToolEvent => ({
  kind: ToolEventKind.Pending,
  callId,
  toolName,
});

const result = (callId: string, data: unknown): ToolEvent => ({
  kind: ToolEventKind.Result,
  callId,
  result: data,
});

const events = {
  nickname: [
    pending("c1", "set_nickname"),
    result("c1", { nickname: "Felps" }),
  ],
  banks: [
    pending("c2", "add_user_banks"),
    result("c2", {
      created: [
        { accountId: "acc-1", bankName: "Nubank" },
        { accountId: "acc-2", bankName: "PicPay" },
      ],
    }),
  ],
  balances: [
    pending("c3", "set_account_balances"),
    result("c3", {
      updated: [
        { accountId: "acc-1", balance: 5000 },
        { accountId: "acc-2", balance: 250 },
      ],
    }),
  ],
  complete: [
    pending("c4", "complete_onboarding"),
    result("c4", { ok: true }),
  ],
};

afterEach(() => {
  routerPush.mockReset();
});

describe("OnboardingProgress", () => {
  it("renderiza os labels dos 5 steps", () => {
    render(<OnboardingProgress toolEvents={[]} />);

    for (const label of ["Apelido", "Bancos", "Saldos", "Ajustes", "Pronto"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("mostra badge do apelido depois que set_nickname resolve", () => {
    render(<OnboardingProgress toolEvents={events.nickname} />);
    expect(screen.getByText("Felps")).toBeInTheDocument();
  });

  it("renderiza cards dos bancos criados", () => {
    render(
      <OnboardingProgress toolEvents={[...events.nickname, ...events.banks]} />,
    );
    expect(screen.getByText("Nubank")).toBeInTheDocument();
    expect(screen.getByText("PicPay")).toBeInTheDocument();
  });

  it("mostra saldos formatados em BRL quando set_account_balances resolve", () => {
    render(
      <OnboardingProgress
        toolEvents={[
          ...events.nickname,
          ...events.banks,
          ...events.balances,
        ]}
      />,
    );
    expect(screen.getByText(/R\$\s?5\.000,00/)).toBeInTheDocument();
    expect(screen.getByText(/R\$\s?250,00/)).toBeInTheDocument();
  });

  it("saldos ausentes viram '—'", () => {
    render(
      <OnboardingProgress toolEvents={[...events.nickname, ...events.banks]} />,
    );
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBe(2);
  });

  it("navega pra redirectTo depois do complete_onboarding com ok:true", () => {
    vi.useFakeTimers();
    render(
      <OnboardingProgress
        toolEvents={[
          ...events.nickname,
          ...events.banks,
          ...events.balances,
          ...events.complete,
        ]}
      />,
    );

    expect(routerPush).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1200);
    expect(routerPush).toHaveBeenCalledWith("/");
    vi.useRealTimers();
  });

  it("respeita prop redirectTo customizada", () => {
    vi.useFakeTimers();
    render(
      <OnboardingProgress
        toolEvents={events.complete}
        redirectTo="/dashboard"
      />,
    );
    vi.advanceTimersByTime(1200);
    expect(routerPush).toHaveBeenCalledWith("/dashboard");
    vi.useRealTimers();
  });

  it("não redireciona antes do complete_onboarding OK", () => {
    vi.useFakeTimers();
    render(
      <OnboardingProgress
        toolEvents={[...events.nickname, ...events.banks]}
      />,
    );
    vi.advanceTimersByTime(3000);
    expect(routerPush).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
