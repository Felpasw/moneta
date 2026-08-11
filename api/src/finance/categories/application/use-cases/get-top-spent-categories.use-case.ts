import { Inject, Injectable } from '@nestjs/common';

import {
  CATEGORIES_REPOSITORY,
  type CategoriesRepository,
  type GetTopSpentInMonthInput,
  type TopSpentCategory,
} from '../../domain/ports/categories-repository';

@Injectable()
export class GetTopSpentCategoriesUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: GetTopSpentInMonthInput): Promise<TopSpentCategory[]> {
    return this.categories.getTopSpentInMonth(input);
  }
}
