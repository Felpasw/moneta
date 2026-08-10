import type {
  UseMutationResult,
  UseSuspenseQueryResult,
} from "@tanstack/react-query";

import type {
  AddCategoryInput,
  Category,
  CategoryWithUsage,
  UpdateCategoryInput,
} from "@/services/interfaces/categories.interface";

export interface UpdateCategoryVariables {
  id: string;
  patch: UpdateCategoryInput;
}

export interface CategoriesHooksResult {
  list: UseSuspenseQueryResult<CategoryWithUsage[]>;
  create: UseMutationResult<Category, unknown, AddCategoryInput>;
  update: UseMutationResult<Category, unknown, UpdateCategoryVariables>;
  remove: UseMutationResult<void, unknown, string>;
}

export interface ICategoriesHooks {
  use(): CategoriesHooksResult;
}
