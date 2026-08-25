import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CLOCK, type Clock } from '~/@common/domain/ports/clock';
import { ZodValidationPipe } from '~/@common/infrastructure/pipes/zod-validation.pipe';
import type { DecodedToken } from '~/auth/domain/services/token-service';
import { CurrentUser } from '~/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';
import {
  SAVED_CHARTS_REPOSITORY,
  type SavedChartsRepository,
} from '~/finance/charts/domain/ports/saved-charts-repository';
import { chartSpecSchema } from '~/finance/charts/domain/schemas/chart-spec';

import {
  renameSavedChartSchema,
  type RenameSavedChartDto,
} from './dto/rename-saved-chart.dto';
import { saveChartSchema, type SaveChartDto } from './dto/save-chart.dto';

@Controller('saved-charts')
@UseGuards(JwtAuthGuard)
export class SavedChartsController {
  constructor(
    @Inject(SAVED_CHARTS_REPOSITORY)
    private readonly repository: SavedChartsRepository,
    private readonly chartQueryBuilder: ChartQueryBuilder,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  @Get()
  async list(@CurrentUser() user: DecodedToken) {
    const items = await this.repository.listSummaries({ userId: user.sub });
    return { items };
  }

  @Post()
  async save(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(saveChartSchema)) body: SaveChartDto,
  ) {
    const created = await this.repository.add({
      userId: user.sub,
      name: body.name,
      spec: body.spec,
    });
    return { id: created.id };
  }

  @Post(':id/run')
  @HttpCode(HttpStatus.OK)
  async run(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    const saved = await this.repository.findById({ userId: user.sub, id });
    if (!saved) throw new NotFoundException('saved chart not found');

    const specCheck = chartSpecSchema.safeParse(saved.spec);
    if (!specCheck.success) {
      throw new NotFoundException('saved chart spec is corrupted');
    }

    const data = await this.chartQueryBuilder.build(
      specCheck.data,
      user.sub,
      this.clock.now(),
    );
    return { spec: specCheck.data, data, meta: data.meta };
  }

  @Patch(':id/name')
  async rename(
    @CurrentUser() user: DecodedToken,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(renameSavedChartSchema))
    body: RenameSavedChartDto,
  ) {
    try {
      const updated = await this.repository.rename({
        userId: user.sub,
        id,
        name: body.name,
      });
      return {
        id: updated.id,
        name: updated.name,
        pinned: updated.pinned,
        updatedAt: updated.updatedAt,
      };
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        throw new NotFoundException('saved chart not found');
      }
      throw err;
    }
  }

  @Patch(':id/pin')
  async togglePin(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      const updated = await this.repository.togglePin({
        userId: user.sub,
        id,
      });
      return { id: updated.id, pinned: updated.pinned };
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        throw new NotFoundException('saved chart not found');
      }
      throw err;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      await this.repository.delete({ userId: user.sub, id });
    } catch (err) {
      if (err instanceof SavedChartNotFoundError) {
        throw new NotFoundException('saved chart not found');
      }
      throw err;
    }
  }
}
