export const CATEGORIES_REPOSITORY = Symbol('CATEGORIES_REPOSITORY');

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  monthlyBudget: number | null;
}

export interface AddCategoryInput {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
  monthlyBudget?: number;
}

export interface UpdateCategoryInput {
  id: string;
  userId: string;
  name?: string;
  icon?: string | null;
  color?: string | null;
  monthlyBudget?: number | null;
}

export interface CategoriesRepository {
  listForUser(userId: string): Promise<Category[]>;
  addCustom(input: AddCategoryInput): Promise<Category>;
  update(input: UpdateCategoryInput): Promise<Category | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
