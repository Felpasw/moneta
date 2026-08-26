import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';

import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';
import type {
  AddSavedChartInput,
  RenameSavedChartInput,
  SavedChart,
  SavedChartSummary,
  SavedChartsRepository,
} from '~/finance/charts/domain/ports/saved-charts-repository';
import { PrismaService } from '~/infrastructure/prisma/prisma.service';

const SUMMARY_SELECT = {
  id: true,
  name: true,
  spec: true,
  pinned: true,
  updatedAt: true,
} satisfies Prisma.SavedChartSelect;

@Injectable()
export class PrismaSavedChartsRepository implements SavedChartsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async add(input: AddSavedChartInput): Promise<SavedChart> {
    return this.prisma.savedChart.create({
      data: {
        userId: input.userId,
        name: input.name,
        spec: input.spec,
      },
    });
  }

  async findById(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<SavedChart | null> {
    return this.prisma.savedChart.findFirst({
      where: { id: params.id, userId: params.userId },
    });
  }

  async listSummaries(params: {
    readonly userId: string;
  }): Promise<SavedChartSummary[]> {
    return this.prisma.savedChart.findMany({
      where: { userId: params.userId },
      orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      select: SUMMARY_SELECT,
    });
  }

  async rename(input: RenameSavedChartInput): Promise<SavedChart> {
    await this.assertOwnership({ userId: input.userId, id: input.id });
    return this.prisma.savedChart.update({
      where: { id: input.id },
      data: { name: input.name },
    });
  }

  async togglePin(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<SavedChart> {
    const current = await this.assertOwnership(params);
    return this.prisma.savedChart.update({
      where: { id: params.id },
      data: { pinned: !current.pinned },
    });
  }

  async delete(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<void> {
    await this.assertOwnership(params);
    await this.prisma.savedChart.delete({ where: { id: params.id } });
  }

  private async assertOwnership(params: {
    readonly userId: string;
    readonly id: string;
  }): Promise<SavedChart> {
    const row = await this.prisma.savedChart.findFirst({
      where: { id: params.id, userId: params.userId },
    });
    if (!row) throw new SavedChartNotFoundError(params.id);
    return row;
  }
}
