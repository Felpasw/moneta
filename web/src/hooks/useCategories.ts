/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `categoriesHooks.use()` acontece
 * durante o render em ordem estável, então Rules of Hooks (runtime) segue
 * respeitada. Regra: `use()` chama todos os hooks no topo em ordem fixa, sem
 * `if`/loop.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import categoriesService from "@/services/categories.service";
import type {
  AddCategoryInput,
  Category,
} from "@/services/interfaces/categories.interface";

import type {
  CategoriesHooksResult,
  ICategoriesHooks,
  RenameCategoryVariables,
} from "./interfaces/useCategories.interface";

export const CATEGORIES_QUERY_KEYS = {
  all: ["categories"] as const,
  list: ["categories", "list"] as const,
};

class CategoriesHooks implements ICategoriesHooks {
  use(): CategoriesHooksResult {
    const queryClient = useQueryClient();

    const invalidateList = () =>
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEYS.list });

    const list = useQuery<Category[]>({
      queryKey: CATEGORIES_QUERY_KEYS.list,
      queryFn: () => categoriesService.list(),
    });

    const create = useMutation<Category, unknown, AddCategoryInput>({
      mutationFn: (input) => categoriesService.create(input),
      onSuccess: () => {
        void invalidateList();
      },
    });

    const rename = useMutation<Category, unknown, RenameCategoryVariables>({
      mutationFn: ({ id, patch }) => categoriesService.rename(id, patch),
      onSuccess: () => {
        void invalidateList();
      },
    });

    const remove = useMutation<void, unknown, string>({
      mutationFn: (id) => categoriesService.remove(id),
      onSuccess: () => {
        void invalidateList();
      },
    });

    return { list, create, rename, remove };
  }
}

const categoriesHooks = new CategoriesHooks();

export default categoriesHooks;
