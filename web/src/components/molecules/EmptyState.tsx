"use client";

import type { EmptyStateProps } from "@/components/molecules/interfaces/EmptyState.interface";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border p-10 text-center",
        className,
      )}
    >
      {icon !== undefined ? (
        <div className="text-muted-foreground">{icon}</div>
      ) : null}
      <p className="font-heading text-lg font-medium">{title}</p>
      {description !== undefined ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action !== undefined ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export default EmptyState;
