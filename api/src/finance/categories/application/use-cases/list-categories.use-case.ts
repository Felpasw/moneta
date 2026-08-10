import { Inject, Injectable } from '@nestjs/common';

import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
  type CategoryWithUsage,
} from '../../domain/ports/categories-repository';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: { userId: string }): Promise<CategoryWithUsage[]> {
    return this.categories.listForUser(input.userId);
  }
}
