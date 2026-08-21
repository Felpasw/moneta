import { z } from 'zod';

import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';

export const chartTypeSchema = z.enum([
  'bar',
  'stacked-bar',
  'line',
  'area',
  'pie',
  'donut',
  'scatter',
  'heatmap',
]);

export const xFieldSchema = z.enum([
  'date',
  'category',
  'bank',
  'transactionType',
]);

export const groupingSchema = z.enum([
  'day',
  'week',
  'month',
  'quarter',
  'year',
  'category',
  'bank',
]);

export const yFieldSchema = z.enum(['amount', 'count']);

export const aggregationSchema = z.enum(['sum', 'avg', 'min', 'max', 'count']);

export const datePresetSchema = z.enum(['this_month', 'ytd', 'all_time']);

export const rollingUnitSchema = z.enum([
  'day',
  'week',
  'month',
  'quarter',
  'year',
]);

const absoluteDateRangeSchema = z
  .object({
    from: z.iso.datetime(),
    to: z.iso.datetime(),
  })
  .strict();

const presetDateRangeSchema = z
  .object({
    preset: datePresetSchema,
  })
  .strict();

const rollingDateRangeSchema = z
  .object({
    rolling: z
      .object({
        unit: rollingUnitSchema,
        n: z.number().int().min(1).max(1000),
      })
      .strict(),
  })
  .strict();

export const dateRangeSchema = z.union([
  absoluteDateRangeSchema,
  presetDateRangeSchema,
  rollingDateRangeSchema,
]);

const filtersSchema = z
  .object({
    dateRange: dateRangeSchema.optional(),
    transactionTypes: z.array(z.enum(TransactionType)).optional(),
    categoryIds: z.array(z.uuid()).optional(),
    accountIds: z.array(z.uuid()).optional(),
    bankIds: z.array(z.uuid()).optional(),
  })
  .strict();

const xAxisSchema = z
  .object({
    field: xFieldSchema,
    grouping: groupingSchema.optional(),
  })
  .strict();

const yAxisSchema = z
  .object({
    field: yFieldSchema,
    aggregation: aggregationSchema,
  })
  .strict()
  .superRefine((val, ctx) => {
    if (val.field === 'count' && val.aggregation !== 'count') {
      ctx.addIssue({
        code: 'custom',
        message: `aggregation '${val.aggregation}' is not valid for field 'count' (only 'count' is allowed)`,
        path: ['aggregation'],
      });
    }
  });

export const chartSpecSchema = z
  .object({
    chartType: chartTypeSchema,
    xAxis: xAxisSchema,
    yAxis: yAxisSchema,
    filters: filtersSchema,
    title: z.string().trim().min(1).max(100),
    seriesLabel: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type ChartType = z.infer<typeof chartTypeSchema>;
export type XField = z.infer<typeof xFieldSchema>;
export type Grouping = z.infer<typeof groupingSchema>;
export type YField = z.infer<typeof yFieldSchema>;
export type Aggregation = z.infer<typeof aggregationSchema>;
export type DatePreset = z.infer<typeof datePresetSchema>;
export type RollingUnit = z.infer<typeof rollingUnitSchema>;
export type DateRange = z.infer<typeof dateRangeSchema>;
export type ChartSpec = z.infer<typeof chartSpecSchema>;
