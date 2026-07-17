import { Inject, Injectable } from '@nestjs/common';

import { CategoryNotFoundError } from '../../domain/errors/category-not-found.error';
import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
} from '../../domain/ports/categories-repository';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    const deleted = await this.categories.delete(input.id, input.userId);
    if (!deleted) {
      throw new CategoryNotFoundError(input.id);
    }
  }
}
