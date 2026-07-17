import { Inject, Injectable } from '@nestjs/common';

import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
  type Category,
} from '../../domain/ports/categories-repository';

@Injectable()
export class ListCategoriesUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: { userId: string }): Promise<Category[]> {
    return this.categories.listForUser(input.userId);
  }
}
