export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  monthlyBudget: number | null;
}

export interface CategoryWithUsage extends Category {
  spent: number;
  usagePct: number;
  overBudget: boolean;
}

export interface AddCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string | null;
  color?: string | null;
  monthlyBudget?: number | null;
}

export interface ICategoriesService {
  list(): Promise<CategoryWithUsage[]>;
  create(input: AddCategoryInput): Promise<Category>;
  update(id: string, patch: UpdateCategoryInput): Promise<Category>;
  remove(id: string): Promise<void>;
}
