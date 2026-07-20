import { Module } from '@nestjs/common';

import { CategoriesModule } from '../../../categories/categories.module';
import { AddCategoryTool } from './add-category.tool';
import { DeleteCategoryTool } from './delete-category.tool';
import { ListCategoriesTool } from './list-categories.tool';
import { RenameCategoryTool } from './rename-category.tool';

@Module({
  imports: [CategoriesModule],
  providers: [
    ListCategoriesTool,
    AddCategoryTool,
    RenameCategoryTool,
    DeleteCategoryTool,
  ],
})
export class CategoriesToolsModule {}
