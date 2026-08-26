"use client";

import { useEffect } from "react";

import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/atoms/Button";
import { DynamicChart } from "@/components/organisms/DynamicChart";
import {
  chartTakeoverActions,
  useChartTakeoverStore,
} from "@/stores/chartTakeoverStore";

const OVERLAY_EASE = [0.16, 1, 0.3, 1] as const;

export function ChartTakeoverOverlay() {
  const open = useChartTakeoverStore((s) => s.open);
  const spec = useChartTakeoverStore((s) => s.spec);
  const data = useChartTakeoverStore((s) => s.data);

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
        <motion.div
          key="chart-takeover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: OVERLAY_EASE }}
          className="bg-background fixed inset-0 z-50 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label={spec.title}
        >
          <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => chartTakeoverActions.close()}
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="truncate text-sm font-medium opacity-80">
              {spec.title}
            </h2>
          </header>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.3, ease: OVERLAY_EASE }}
            className="flex flex-1 items-center justify-center px-4 py-6 sm:px-8"
          >
            <div className="w-full max-w-4xl">
              <DynamicChart spec={spec} data={data} />
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default ChartTakeoverOverlay;
