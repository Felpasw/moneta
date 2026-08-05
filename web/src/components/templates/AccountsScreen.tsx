"use client";

import { motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import { MOCK_ACCOUNTS_SUMMARY, MOCK_ACCOUNT_ROWS } from "@/mocks/finance";
import { formatBRL } from "@/utils/currency";
import {
  SETTINGS_STAGGER_CONTAINER,
  SETTINGS_STAGGER_ITEM,
} from "@/utils/settingsStagger";

export function AccountsScreen() {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Accounts</h1>
        <p className="text-sm text-muted-foreground">
          Your checking accounts connected in one place.
        </p>
      </section>

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Total balance"
        className="rounded-2xl bg-neutral-900 p-6 text-neutral-50"
      >
        <p className="text-xs uppercase tracking-wide opacity-60">
          Total balance
        </p>
        <p className="mt-1 font-heading text-3xl font-semibold">
          {formatBRL(MOCK_ACCOUNTS_SUMMARY.totalBalance)}
        </p>
        <p className="mt-2 text-xs opacity-60">
          {MOCK_ACCOUNTS_SUMMARY.count} accounts ·{" "}
          {formatBRL(MOCK_ACCOUNTS_SUMMARY.totalOverdraft)} overdraft available
        </p>
      </motion.section>

      <motion.section
        variants={SETTINGS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        aria-label="Accounts list"
        className="grid gap-3 sm:grid-cols-2"
      >
        {MOCK_ACCOUNT_ROWS.map((account) => (
          <motion.div
            key={account.id}
            variants={SETTINGS_STAGGER_ITEM}
            className="flex h-full flex-col gap-4 rounded-2xl bg-neutral-900 p-5 text-neutral-50"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/10 p-1.5">
                <BankIcon bankName={account.bankName} size={32} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {account.nickname}
                </p>
                <p className="truncate text-xs opacity-60">
                  {account.bankName}
                </p>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide opacity-60">
                Balance
              </p>
              <p className="font-heading text-xl font-semibold">
                {formatBRL(account.balance)}
              </p>
            </div>
            {account.overdraftLimit !== null ? (
              <p className="text-xs opacity-60">
                Overdraft: {formatBRL(account.overdraftLimit)}
              </p>
            ) : null}
          </motion.div>
        ))}
      </motion.section>
    </main>
  );
}

export default AccountsScreen;
