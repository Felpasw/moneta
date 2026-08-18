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
      className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-neutral-900 p-5 text-neutral-50"
    >
      <div className="flex items-center gap-3">
        <BankIcon bankName={account.bank.name} size={44} />
        <div className="min-w-0">
          <p className="truncate text-base font-medium">{account.nickname}</p>
          <p className="truncate text-sm opacity-60">{account.bank.name}</p>
        </div>
      </div>
      <div className="flex flex-1 flex-col justify-center py-4">
        <p className="text-xs uppercase tracking-[0.2em] opacity-50">Balance</p>
        <p className="font-heading text-5xl font-semibold leading-tight tracking-tight">
          {formatBRL(account.balance)}
        </p>
      </div>
      {account.overdraftLimit !== null ? (
        <p className="text-xs opacity-50">
          Overdraft: {formatBRL(account.overdraftLimit)}
        </p>
      ) : null}
    </motion.div>
  );
}

export default CheckingAccountCard;
