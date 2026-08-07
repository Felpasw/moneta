import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AddCategoryUseCase } from './application/use-cases/add-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { CategoriesController } from './categories.controller';
import { CATEGORIES_REPOSITORY } from './domain/ports/categories-repository';
import { PrismaCategoriesRepository } from './infrastructure/repositories/prisma-categories.repository';

@Module({
  imports: [AuthModule],
  controllers: [CategoriesController],
  providers: [
    { provide: CATEGORIES_REPOSITORY, useClass: PrismaCategoriesRepository },
    ListCategoriesUseCase,
    AddCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
  exports: [
    ListCategoriesUseCase,
    AddCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
})
export class CategoriesModule {}
