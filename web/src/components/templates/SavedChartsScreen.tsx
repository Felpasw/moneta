"use client";

import { useCallback } from "react";

import { SavedChartCard } from "@/components/organisms/SavedChartCard";
import savedChartsHooks from "@/hooks/useSavedCharts";
import { chartTakeoverActions } from "@/stores/chartTakeoverStore";

const EMPTY_TITLE = "No saved charts yet";
const EMPTY_HINT = "Ask the assistant to save a chart and it will show up here.";
const SCREEN_TITLE = "Saved charts";
const DELETE_CONFIRM = "Delete this saved chart?";

export function SavedChartsScreen() {
  const { view, run, rename, togglePin, remove } = savedChartsHooks.use();
  const items = view.data.items;

  const openChart = useCallback(
    (id: string) => {
      run.mutate(id, {
        onSuccess: (payload) => {
          chartTakeoverActions.open({ spec: payload.spec, data: payload.data });
        },
      });
    },
    [run],
  );

  const renameChart = useCallback(
    (id: string) => {
      const current = items.find((c) => c.id === id);
      const next = window.prompt("New name", current?.name ?? "");
      if (!next || next.trim().length === 0) return;
      rename.mutate({ id, name: next.trim() });
    },
    [items, rename],
  );

  const removeChart = useCallback(
    (id: string) => {
      if (!window.confirm(DELETE_CONFIRM)) return;
      remove.mutate(id);
    },
    [remove],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 sm:px-8">
      <header>
        <h1 className="text-lg font-medium">{SCREEN_TITLE}</h1>
      </header>
      {items.length === 0 ? (
        <div className="border-white/10 flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-12 text-center">
          <p className="text-sm">{EMPTY_TITLE}</p>
          <p className="text-xs opacity-60">{EMPTY_HINT}</p>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          }}
        >
          {items.map((chart) => (
            <SavedChartCard
              key={chart.id}
              chart={chart}
              onOpen={openChart}
              onTogglePin={(id) => togglePin.mutate(id)}
              onRename={renameChart}
              onDelete={removeChart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SavedChartsScreen;
