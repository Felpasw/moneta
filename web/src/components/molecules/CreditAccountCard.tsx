"use client";

import { motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { CreditAccountCardProps } from "@/components/molecules/interfaces/CreditAccountCard.interface";
import type { InvoiceStatus } from "@/services/interfaces/accounts.interface";
import { formatBRL, formatDayMonth } from "@/utils/currency";
import { SETTINGS_STAGGER_ITEM } from "@/utils/settingsStagger";

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: "Open",
  closed: "Closed",
  paid: "Paid",
  overdue: "Overdue",
};

const USAGE_EASE = [0.16, 1, 0.3, 1] as const;

export function CreditAccountCard({ account }: CreditAccountCardProps) {
  return (
    <motion.article
      variants={SETTINGS_STAGGER_ITEM}
      className="flex h-full flex-col overflow-hidden rounded-2xl bg-neutral-900 text-neutral-50"
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2">
              <BankIcon bankName={account.bank.name} size={28} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{account.nickname}</p>
              <p className="truncate text-xs opacity-60">{account.bank.name}</p>
            </div>
          </div>
          {account.currentInvoice !== null && (
            <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
              {INVOICE_STATUS_LABEL[account.currentInvoice.status]}
            </span>
          )}
        </div>

        <div className="mt-6">
          <p className="text-xs uppercase tracking-wide opacity-60">
            {account.currentInvoice !== null
              ? "Current statement"
              : "Credit limit"}
          </p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {formatBRL(
              account.currentInvoice?.totalAmount ?? account.creditLimit ?? 0,
            )}
          </p>
        </div>
      </div>

      {account.currentInvoice !== null && (
        <div className="mt-auto space-y-4 border-t border-white/10 p-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>Limit usage</span>
              <span>{account.usagePct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${account.usagePct}%` }}
                transition={{ duration: 0.6, ease: USAGE_EASE }}
                className="h-full rounded-full bg-white"
              />
            </div>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <dt className="opacity-60">Available</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatBRL(
                  Math.max(
                    0,
                    (account.creditLimit ?? 0) -
                      account.currentInvoice.totalAmount,
                  ),
                )}
              </dd>
            </div>
            <div>
              <dt className="opacity-60">Limit</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatBRL(account.creditLimit ?? 0)}
              </dd>
            </div>
            <div>
              <dt className="opacity-60">Due date</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {formatDayMonth(new Date(account.currentInvoice.dueDate))}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {account.currentInvoice === null && account.dueDay !== null && (
        <div className="mt-auto border-t border-white/10 p-5">
          <p className="text-xs opacity-60">
            Due day: {String(account.dueDay).padStart(2, "0")}
          </p>
        </div>
      )}
    </motion.article>
  );
}

export default CreditAccountCard;
