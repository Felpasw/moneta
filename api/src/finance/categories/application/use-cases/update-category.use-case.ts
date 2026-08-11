import { Inject, Injectable } from '@nestjs/common';

import { CategoryNotFoundError } from '../../domain/errors/category-not-found.error';
import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
  type Category,
  type UpdateCategoryInput,
} from '../../domain/ports/categories-repository';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<Category> {
    const updated = await this.categories.update(input);
    if (updated === null) throw new CategoryNotFoundError(input.id);
    return updated;
  }
}
