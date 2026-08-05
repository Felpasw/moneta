import type { UseMutationResult, UseQueryResult } from "@tanstack/react-query";

import type {
  AddCategoryInput,
  Category,
  RenameCategoryInput,
} from "@/services/interfaces/categories.interface";

export interface RenameCategoryVariables {
  id: string;
  patch: RenameCategoryInput;
}

export interface CategoriesHooksResult {
  list: UseQueryResult<Category[]>;
  create: UseMutationResult<Category, unknown, AddCategoryInput>;
  rename: UseMutationResult<Category, unknown, RenameCategoryVariables>;
  remove: UseMutationResult<void, unknown, string>;
}

export interface ICategoriesHooks {
  use(): CategoriesHooksResult;
}
