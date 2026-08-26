/* eslint-disable react-hooks/rules-of-hooks --
 * Same rationale as useDashboard: class encapsulates hooks but does not run
 * as a React class component. `use()` calls hooks in a fixed order during
 * render, so Rules of Hooks are respected at runtime.
 */

import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import savedChartsService from "@/services/savedCharts.service";
import type { SavedChartsView } from "@/services/interfaces/savedCharts.interface";

import type {
  ISavedChartsHooks,
  SavedChartsHooksResult,
} from "./interfaces/useSavedCharts.interface";

export const SAVED_CHARTS_QUERY_KEYS = {
  all: ["savedCharts"] as const,
  view: ["savedCharts", "view"] as const,
};

class SavedChartsHooks implements ISavedChartsHooks {
  use(): SavedChartsHooksResult {
    const queryClient = useQueryClient();

    const view = useSuspenseQuery<SavedChartsView>({
      queryKey: SAVED_CHARTS_QUERY_KEYS.view,
      queryFn: () => savedChartsService.list(),
    });

    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: SAVED_CHARTS_QUERY_KEYS.view,
      });

    const run = useMutation({
      mutationFn: (id: string) => savedChartsService.run(id),
    });

    const rename = useMutation({
      mutationFn: (input: { id: string; name: string }) =>
        savedChartsService.rename(input.id, input.name),
      onSuccess: invalidate,
    });

    const togglePin = useMutation({
      mutationFn: (id: string) => savedChartsService.togglePin(id),
      onSuccess: invalidate,
    });

    const remove = useMutation({
      mutationFn: (id: string) => savedChartsService.delete(id),
      onSuccess: invalidate,
    });

    return { view, run, rename, togglePin, remove };
  }
}

const savedChartsHooks = new SavedChartsHooks();

export default savedChartsHooks;
