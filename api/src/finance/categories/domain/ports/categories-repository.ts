export const CATEGORIES_REPOSITORY = Symbol('CATEGORIES_REPOSITORY');

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface AddCategoryInput {
  userId: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface RenameCategoryInput {
  id: string;
  userId: string;
  name: string;
}

export interface CategoriesRepository {
  listForUser(userId: string): Promise<Category[]>;
  addCustom(input: AddCategoryInput): Promise<Category>;
  rename(input: RenameCategoryInput): Promise<Category | null>;
  delete(id: string, userId: string): Promise<boolean>;
}
