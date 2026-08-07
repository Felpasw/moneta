"use client";

import { motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { CreditAccountCardProps } from "@/components/molecules/interfaces/CreditAccountCard.interface";
import { formatBRL } from "@/utils/currency";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

export function CreditAccountCard({ account }: CreditAccountCardProps) {
  return (
    <motion.article
      variants={SETTINGS_STAGGER_ITEM}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-900 text-neutral-50"
    >
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2">
            <BankIcon bankName={account.bank.name} size={28} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{account.nickname}</p>
            <p className="truncate text-xs opacity-60">{account.bank.name}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide opacity-60">
            Credit limit
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {formatBRL(account.creditLimit ?? 0)}
          </p>
        </div>
      </div>

      {account.dueDay !== null ? (
        <div className="mt-auto border-t border-white/10 p-5">
          <p className="text-xs opacity-60">
            Due day: {String(account.dueDay).padStart(2, "0")}
          </p>
        </div>
      ) : null}
    </motion.article>
  );
}

export default CreditAccountCard;
