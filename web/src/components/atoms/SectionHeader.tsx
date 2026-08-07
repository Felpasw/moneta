import type { SectionHeaderProps } from "@/components/atoms/interfaces/SectionHeader.interface";

const BASE_CLASS =
  "text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70";

export function SectionHeader({ children, className }: SectionHeaderProps) {
  const finalClass =
    className !== undefined ? `${BASE_CLASS} ${className}` : BASE_CLASS;
  return <h2 className={finalClass}>{children}</h2>;
}

export default SectionHeader;
