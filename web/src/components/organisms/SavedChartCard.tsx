"use client";

import { Pencil, Pin, PinOff, Trash2 } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import type { SavedChartCardProps } from "@/components/organisms/interfaces/SavedChartCard.interface";

export function SavedChartCard({
  chart,
  onOpen,
  onTogglePin,
  onRename,
  onDelete,
}: SavedChartCardProps) {
  return (
    <div className="group border-white/10 hover:border-white/25 relative flex flex-col gap-3 rounded-lg border p-4 transition-colors">
      <button
        type="button"
        onClick={() => onOpen(chart.id)}
        className="text-left"
      >
        <h3 className="truncate text-sm font-medium">{chart.name}</h3>
        <p className="text-[11px] opacity-60">{chart.spec.chartType}</p>
      </button>
      <div className="mt-auto flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={chart.pinned ? "Unpin" : "Pin"}
          onClick={() => onTogglePin(chart.id)}
        >
          {chart.pinned ? (
            <PinOff className="h-4 w-4" />
          ) : (
            <Pin className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Rename"
          onClick={() => onRename(chart.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Delete"
          onClick={() => onDelete(chart.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {chart.pinned ? (
        <span className="absolute top-2 right-2 text-[10px] opacity-60">
          pinned
        </span>
      ) : null}
    </div>
  );
}

export default SavedChartCard;
