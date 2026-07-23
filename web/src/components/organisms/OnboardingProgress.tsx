"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

import { BankIcon } from "@/components/atoms/BankIcon";
import { StepIndicator } from "@/components/atoms/StepIndicator";
import type { ToolEvent } from "@/hooks/interfaces/useAgentSession.interface";
import {
  ONBOARDING_STEP_LABELS,
  buildOnboardingSummary,
  deriveActiveStep,
} from "@/utils/onboardingProgress";

const REDIRECT_MS = 1200;

const CURRENCY_FORMATTER = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

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
  const activeIndex = useMemo(() => deriveActiveStep(toolEvents), [toolEvents]);
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
      <StepIndicator
        steps={ONBOARDING_STEP_LABELS as unknown as string[]}
        activeIndex={activeIndex}
      />

      <motion.div
        variants={itemVariants}
        className="mt-10 flex flex-col items-center gap-6"
      >
        <AnimatePresence mode="popLayout">
          {summary.nickname && (
            <motion.div
              key="nickname"
              variants={itemVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-4 py-1.5 text-sm shadow-sm backdrop-blur"
            >
              <span className="text-muted-foreground">Apelido</span>
              <span className="font-medium text-foreground">
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
              className="grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2"
              aria-label="Bancos adicionados"
            >
              <AnimatePresence initial={false}>
                {summary.banks.map((bank) => (
                  <motion.li
                    key={bank.accountId}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/60 px-4 py-3 shadow-sm backdrop-blur"
                  >
                    <BankIcon bankName={bank.bankName} size={32} />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {bank.bankName}
                    </span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {typeof bank.balance === "number"
                        ? CURRENCY_FORMATTER.format(bank.balance)
                        : "—"}
                    </span>
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
      </motion.div>
    </motion.div>
  );
}

export default OnboardingProgress;
