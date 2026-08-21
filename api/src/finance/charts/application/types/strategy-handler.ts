import type { Prisma } from '@prisma/client';

import type {
  ChartSpec,
  Grouping,
} from '~/finance/charts/domain/schemas/chart-spec';
import type { ChartData } from '~/finance/charts/domain/types/chart-data';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

export type TxClient = Parameters<
  Parameters<PrismaService['$transaction']>[0] extends (tx: infer T) => unknown
    ? (tx: T) => void
    : never
>[0];

export interface StrategyContext {
  readonly tx: TxClient;
  readonly where: Prisma.TransactionWhereInput;
  readonly yAxis: ChartSpec['yAxis'];
  readonly grouping: Grouping;
}

export type StrategyHandler = (ctx: StrategyContext) => Promise<ChartData>;
