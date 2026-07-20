import { Inject, Injectable } from '@nestjs/common';

import { CategoryNotFoundError } from '../../domain/errors/category-not-found.error';
import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
  type Category,
  type RenameCategoryInput,
} from '../../domain/ports/categories-repository';

@Injectable()
export class RenameCategoryUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: RenameCategoryInput): Promise<Category> {
    const renamed = await this.categories.rename(input);
    if (!renamed) {
      throw new CategoryNotFoundError(input.id);
    }
    return renamed;
  }
}
