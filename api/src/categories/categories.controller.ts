import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import type { DecodedToken } from '../auth/domain/services/token-service';
import { AddCategoryUseCase } from './application/use-cases/add-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { RenameCategoryUseCase } from './application/use-cases/rename-category.use-case';
import { CategoryNotFoundError } from './domain/errors/category-not-found.error';
import { addCategorySchema, type AddCategoryDto } from './dto/add-category.dto';
import {
  renameCategorySchema,
  type RenameCategoryDto,
} from './dto/rename-category.dto';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly addCategory: AddCategoryUseCase,
    private readonly renameCategory: RenameCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: DecodedToken) {
    return this.listCategories.execute({ userId: user.sub });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(addCategorySchema)) dto: AddCategoryDto,
  ) {
    return this.addCategory.execute({ userId: user.sub, ...dto });
  }

  @Patch(':id')
  async rename(
    @CurrentUser() user: DecodedToken,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(renameCategorySchema)) dto: RenameCategoryDto,
  ) {
    try {
      return await this.renameCategory.execute({
        id,
        userId: user.sub,
        name: dto.name,
      });
    } catch (e) {
      if (e instanceof CategoryNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      await this.deleteCategory.execute({ id, userId: user.sub });
    } catch (e) {
      if (e instanceof CategoryNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
