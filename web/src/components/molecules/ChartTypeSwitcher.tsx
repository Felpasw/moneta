"use client";

import type { ComponentType, SVGProps } from "react";

import { AreaChart, BarChart3, LineChart, PieChart } from "lucide-react";

import { ChartType } from "@/services/interfaces/chart.interface";

interface Option {
  readonly type: ChartType;
  readonly label: string;
  readonly Icon: ComponentType<SVGProps<SVGSVGElement>>;
}

const OPTIONS: readonly Option[] = [
  { type: ChartType.Bar, label: "Bar", Icon: BarChart3 },
  { type: ChartType.Line, label: "Line", Icon: LineChart },
  { type: ChartType.Area, label: "Area", Icon: AreaChart },
  { type: ChartType.Pie, label: "Pie", Icon: PieChart },
];

interface Props {
  selected: ChartType;
  onSelect: (type: ChartType) => void;
}

export function ChartTypeSwitcher({ selected, onSelect }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Chart type"
      className="bg-muted/30 flex gap-1 rounded-lg p-1"
    >
      {OPTIONS.map(({ type, label, Icon }) => {
        const active = type === selected;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={label}
            onClick={() => onSelect(type)}
            data-active={active}
            className="data-[active=true]:bg-background flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs opacity-60 transition-opacity data-[active=true]:opacity-100"
          >
            <Icon className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ChartTypeSwitcher;
