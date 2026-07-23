"use client";

import type { BankIconProps } from "@/components/atoms/interfaces/BankIcon.interface";
import { useBankIcon } from "@/hooks/useBankIcon";
import { cn } from "@/lib/utils";
import { bankInitials } from "@/utils/bankInitials";

interface SlotProps {
  bankName: string;
  size: number;
  className?: string;
}

const FallbackInitials = ({ bankName, size, className }: SlotProps) => (
  <div
    role="img"
    aria-label={bankName}
    className={cn(
      "flex items-center justify-center rounded-full bg-muted text-[0.65em] font-semibold uppercase text-muted-foreground",
      className,
    )}
    style={{ width: size, height: size }}
  >
    {bankInitials(bankName)}
  </div>
);

interface SvgSlotProps extends SlotProps {
  markup: string;
}

const SvgSlot = ({ bankName, size, className, markup }: SvgSlotProps) => (
  <div
    role="img"
    aria-label={bankName}
    className={cn("flex items-center justify-center", className)}
    style={{ width: size, height: size }}
    dangerouslySetInnerHTML={{ __html: markup }}
  />
);

export function BankIcon({ bankName, size = 32, className }: BankIconProps) {
  const state = useBankIcon({ bankName, size });

  if (state.kind === "fallback") {
    return (
      <FallbackInitials
        bankName={bankName}
        size={size}
        className={className}
      />
    );
  }
  return (
    <SvgSlot
      bankName={bankName}
      size={size}
      className={className}
      markup={state.markup}
    />
  );
}

export default BankIcon;
