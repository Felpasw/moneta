"use client";

import { motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import { MOCK_CARD_ROWS } from "@/mocks/finance";
import type { InvoiceStatus } from "@/mocks/finance";
import { formatBRL, formatDayMonth } from "@/utils/currency";
import {
  SETTINGS_STAGGER_CONTAINER,
  SETTINGS_STAGGER_ITEM,
} from "@/utils/settingsStagger";

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  open: "Open",
  closed: "Closed",
  paid: "Paid",
};

export function CardsScreen() {
  return (
    <main className="mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 py-8">
      <section className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Cards</h1>
        <p className="text-sm text-muted-foreground">
          Statements, limits and cycles of your credit cards.
        </p>
      </section>

      <motion.section
        variants={SETTINGS_STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        aria-label="Cards list"
        className="flex flex-col gap-4"
      >
        {MOCK_CARD_ROWS.map((card) => (
          <motion.article
            key={card.id}
            variants={SETTINGS_STAGGER_ITEM}
            className="overflow-hidden rounded-2xl bg-neutral-900 text-neutral-50"
          >
            <div className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white/10 p-2">
                    <BankIcon bankName={card.bankName} size={28} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {card.nickname}
                    </p>
                    <p className="truncate text-xs opacity-60">
                      {card.bankName}
                    </p>
                  </div>
                </div>
                {card.invoiceStatus !== null ? (
                  <span className="shrink-0 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                    {INVOICE_STATUS_LABEL[card.invoiceStatus]}
                  </span>
                ) : null}
              </div>

              <div className="mt-8">
                <p className="text-xs uppercase tracking-wide opacity-60">
                  Current statement
                </p>
                <p className="mt-1 font-heading text-3xl font-semibold">
                  {formatBRL(card.spent)}
                </p>
              </div>
            </div>

            <div className="space-y-4 border-t border-white/10 p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs opacity-60">
                  <span>Limit usage</span>
                  <span>{card.usagePct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${card.usagePct}%` }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full bg-white"
                  />
                </div>
              </div>

              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="opacity-60">Available</dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {formatBRL(card.available)}
                  </dd>
                </div>
                <div>
                  <dt className="opacity-60">Limit</dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {formatBRL(card.limit)}
                  </dd>
                </div>
                <div>
                  <dt className="opacity-60">Due date</dt>
                  <dd className="mt-0.5 text-sm font-medium">
                    {card.dueDate !== null ? formatDayMonth(card.dueDate) : "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </motion.article>
        ))}
      </motion.section>
    </main>
  );
}

export default CardsScreen;
