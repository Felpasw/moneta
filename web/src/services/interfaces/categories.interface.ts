export interface Category {
  id: string;
  userId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
}

export interface AddCategoryInput {
  name: string;
  icon?: string;
  color?: string;
}

export interface RenameCategoryInput {
  name: string;
}

export interface ICategoriesService {
  list(): Promise<Category[]>;
  create(input: AddCategoryInput): Promise<Category>;
  rename(id: string, patch: RenameCategoryInput): Promise<Category>;
  remove(id: string): Promise<void>;
}
