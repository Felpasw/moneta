"use client";

import { motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { CheckingAccountCardProps } from "@/components/molecules/interfaces/CheckingAccountCard.interface";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

export function CheckingAccountCard({ account }: CheckingAccountCardProps) {
  return (
    <motion.div
      variants={SETTINGS_STAGGER_ITEM}
      className="flex h-full flex-col gap-4 rounded-2xl bg-neutral-900 p-5 text-neutral-50"
    >
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-white/10 p-1.5">
          <BankIcon bankName={account.bank.name} size={32} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{account.nickname}</p>
          <p className="truncate text-xs opacity-60">{account.bank.name}</p>
        </div>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide opacity-60">Balance</p>
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
  );
}

export default CheckingAccountCard;
