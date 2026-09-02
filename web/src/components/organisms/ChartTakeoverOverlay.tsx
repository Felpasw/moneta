"use client";

import { useEffect } from "react";

import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { ChartTypeSwitcher } from "@/components/molecules/ChartTypeSwitcher";
import { DynamicChart } from "@/components/organisms/DynamicChart";
import {
  chartTakeoverActions,
  useChartTakeoverStore,
} from "@/stores/chartTakeoverStore";

const SHEET_EASE = [0.16, 1, 0.3, 1] as const;
const SHEET_HEIGHT_VH = 72;
const DRAG_DISMISS_THRESHOLD = 120;

export function ChartTakeoverOverlay() {
  const open = useChartTakeoverStore((s) => s.open);
  const spec = useChartTakeoverStore((s) => s.spec);
  const data = useChartTakeoverStore((s) => s.data);
  const selectedType = useChartTakeoverStore((s) => s.selectedType);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") chartTakeoverActions.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open && spec && data ? (
        <>
          <motion.div
            key="chart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: SHEET_EASE }}
            onClick={() => chartTakeoverActions.close()}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden
            data-testid="chart-backdrop"
          />
          <motion.div
            key="chart-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: SHEET_EASE }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > DRAG_DISMISS_THRESHOLD) {
                chartTakeoverActions.close();
              }
            }}
            className="bg-background fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border border-white/10 shadow-2xl"
            style={{ height: `${SHEET_HEIGHT_VH}vh` }}
            role="dialog"
            aria-modal="true"
            aria-label={spec.title}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div
                className="h-1 w-10 rounded-full bg-white/20"
                aria-hidden
              />
            </div>
            <header className="flex items-center gap-3 px-4 py-2 sm:px-6">
              <h2 className="flex-1 truncate text-sm font-medium opacity-80">
                {spec.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => chartTakeoverActions.close()}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </header>
            <div className="px-4 pt-1 pb-3 sm:px-6">
              <ChartTypeSwitcher
                selected={selectedType ?? spec.chartType}
                onSelect={chartTakeoverActions.setSelectedType}
              />
            </div>
            <div className="flex flex-1 items-center justify-center overflow-y-auto px-4 pb-40 sm:px-8">
              <div className="w-full max-w-4xl">
                <DynamicChart
                  spec={{ ...spec, chartType: selectedType ?? spec.chartType }}
                  data={data}
                />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default ChartTakeoverOverlay;
