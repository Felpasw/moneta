"use client";

import { Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { BankIcon } from "@/components/atoms/BankIcon";
import type { BankAvatarProps } from "@/components/molecules/interfaces/BankAvatar.interface";

const BUMP_TRANSITION = { type: "spring", stiffness: 400, damping: 25 } as const;
const BADGE_TRANSITION = { type: "spring", stiffness: 500, damping: 30 } as const;

export function BankAvatar({ account, isSelected, onClick }: BankAvatarProps) {
  return (
    <motion.button
      type="button"
      layoutId={`bank-${account.id}`}
      onClick={onClick}
      data-selected={isSelected || undefined}
      className="group relative flex cursor-pointer flex-col items-center gap-1.5 outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={BUMP_TRANSITION}
    >
      <div
        data-selected={isSelected || undefined}
        className="relative h-16 w-16 overflow-hidden rounded-full opacity-50 transition-all duration-200 hover:opacity-75 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 data-[selected]:opacity-100"
      >
        <BankIcon
          bankName={account.bank.name}
          size={64}
          data-selected={isSelected || undefined}
          className="h-full w-full grayscale transition-all duration-200 data-[selected]:grayscale-0"
        />
      </div>

      <AnimatePresence>
        {!isSelected ? (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={BADGE_TRANSITION}
            className="absolute bottom-7 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-foreground shadow-sm"
          >
            <Plus className="h-3 w-3 text-background" strokeWidth={2.5} />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.span
        layoutId={`bank-name-${account.id}`}
        data-selected={isSelected || undefined}
        className="max-w-[80px] truncate text-sm font-medium text-muted-foreground transition-colors duration-200 data-[selected]:text-foreground"
      >
        {account.nickname}
      </motion.span>
    </motion.button>
  );
}

export default BankAvatar;
