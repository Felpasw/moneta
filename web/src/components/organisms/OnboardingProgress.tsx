"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import {
  buildOnboardingSummary,
  type OnboardingBank,
} from "@/utils/onboardingProgress";

const REDIRECT_MS = 1200;

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.12 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.98,
    transition: { duration: 0.25, ease: "easeIn" },
  },
};

const bankCardVariants: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.94 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

const formatBalance = (value?: number): string =>
  typeof value === "number" ? CURRENCY_FORMATTER.format(value) : "—";

const hasCreditFields = (bank: OnboardingBank): boolean =>
  typeof bank.creditLimit === "number" &&
  typeof bank.closeDay === "number" &&
  typeof bank.dueDay === "number";

const dayLabel = (day?: number): string =>
  typeof day === "number" ? String(day).padStart(2, "0") : "—";

interface OnboardingProgressProps {
  toolEvents: readonly ToolEvent[];
  className?: string;
  redirectTo?: string;
}

export function OnboardingProgress({
  toolEvents,
  className,
  redirectTo = "/",
}: OnboardingProgressProps) {
  const router = useRouter();
  const summary = useMemo(
    () => buildOnboardingSummary(toolEvents),
    [toolEvents],
  );

  useEffect(() => {
    if (!summary.isComplete) return undefined;
    const timeout = setTimeout(() => router.push(redirectTo), REDIRECT_MS);
    return () => clearTimeout(timeout);
  }, [summary.isComplete, router, redirectTo]);

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <div className="flex flex-col items-center gap-8">
        <AnimatePresence mode="popLayout">
          {summary.nickname && (
            <motion.div
              key="nickname"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-5 py-2 text-sm shadow-sm backdrop-blur"
            >
              <span className="text-muted-foreground">Apelido</span>
              <span className="text-base font-semibold text-foreground">
                {summary.nickname}
              </span>
            </motion.div>
          )}

          {summary.banks.length > 0 && (
            <motion.ul
              key="banks"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2"
              aria-label="Bancos adicionados"
            >
              <AnimatePresence initial={false}>
                {summary.banks.map((bank) => (
                  <motion.li
                    key={bank.accountId}
                    layout
                    variants={bankCardVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/70 p-5 shadow-md backdrop-blur"
                  >
                    <header className="flex items-center gap-3">
                      <BankIcon bankName={bank.bankName} size={44} />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-base font-semibold text-foreground">
                          {bank.bankName}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">
                          Conta corrente
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                          Saldo
                        </div>
                        <div className="text-lg font-semibold tabular-nums text-foreground">
                          {formatBalance(bank.balance)}
                        </div>
                      </div>
                    </header>

                    {(hasCreditFields(bank) ||
                      typeof bank.overdraftLimit === "number") && (
                      <div className="flex flex-col gap-2 border-t border-border/40 pt-3 text-sm">
                        {hasCreditFields(bank) && (
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                                Cartão de crédito
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Fecha dia {dayLabel(bank.closeDay)} · vence dia{" "}
                                {dayLabel(bank.dueDay)}
                              </div>
                            </div>
                            <div className="text-right tabular-nums font-medium text-foreground">
                              {formatBalance(bank.creditLimit)}
                            </div>
                          </div>
                        )}
                        {typeof bank.overdraftLimit === "number" && (
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[0.65rem] uppercase tracking-wide text-muted-foreground">
                              Cheque especial
                            </div>
                            <div className="text-right tabular-nums font-medium text-foreground">
                              {formatBalance(bank.overdraftLimit)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          )}

          {summary.isComplete && (
            <motion.p
              key="complete"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="text-sm font-medium text-primary"
              role="status"
            >
              Tudo pronto — redirecionando…
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default OnboardingProgress;
