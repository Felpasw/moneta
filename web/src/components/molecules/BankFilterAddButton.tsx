"use client";

import { Plus } from "lucide-react";
import { motion } from "motion/react";

import type { BankFilterAddButtonProps } from "@/components/molecules/interfaces/BankFilterAddButton.interface";

export function BankFilterAddButton({ isOpen, onClick }: BankFilterAddButtonProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-state={isOpen ? "open" : "closed"}
      className="group flex cursor-pointer flex-col items-center gap-1.5 outline-none"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        data-state={isOpen ? "open" : "closed"}
        className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/40 transition-all duration-200 hover:border-muted-foreground/60 hover:bg-muted/50 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2 data-[state=open]:border-primary data-[state=open]:bg-primary/10"
      >
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.2 }}>
          <Plus
            data-state={isOpen ? "open" : "closed"}
            className="h-6 w-6 text-muted-foreground transition-colors duration-200 data-[state=open]:text-primary"
          />
        </motion.div>
      </div>
      <span
        data-state={isOpen ? "open" : "closed"}
        className="text-sm font-medium text-muted-foreground transition-colors duration-200 data-[state=open]:text-primary"
      >
        Add
      </span>
    </motion.button>
  );
}

export default BankFilterAddButton;
