import { Inject, Injectable } from '@nestjs/common';

import {
  CATEGORIES_REPOSITORY,
  type AddCategoryInput,
  type CategoriesRepository,
  type Category,
} from '../../domain/ports/categories-repository';

@Injectable()
export class AddCategoryUseCase {
  constructor(
    @Inject(CATEGORIES_REPOSITORY)
    private readonly categories: CategoriesRepository,
  ) {}

  async execute(input: AddCategoryInput): Promise<Category> {
    return this.categories.addCustom(input);
  }
}
