import api from "@/api";

import type {
  AddCategoryInput,
  Category,
  ICategoriesService,
  RenameCategoryInput,
} from "./interfaces/categories.interface";

class CategoriesService implements ICategoriesService {
  async list(): Promise<Category[]> {
    const { data } = await api.get<Category[]>("/categories");

    return data;
  }

  async create(input: AddCategoryInput): Promise<Category> {
    const { data } = await api.post<Category>("/categories", input);

    return data;
  }

  async rename(id: string, patch: RenameCategoryInput): Promise<Category> {
    const { data } = await api.patch<Category>(`/categories/${id}`, patch);

    return data;
  }

  async remove(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

const categoriesService = new CategoriesService();

export default categoriesService;
