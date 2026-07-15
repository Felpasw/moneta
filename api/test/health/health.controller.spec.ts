import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { EphemeralStoreHealthIndicator } from '~/@common/infrastructure/ephemeral-store/ephemeral-store-health.indicator';
import { HealthController } from '~/health/health.controller';
import { PrismaService } from '~/infrastructure/prisma/prisma.service';

const makePrisma = (ok: boolean) => ({
  $queryRaw: ok
    ? jest.fn().mockResolvedValue([{ '?column?': 1 }])
    : jest.fn().mockRejectedValue(new Error('postgres unreachable')),
});

const makeEphemeral = (ok: boolean) => ({
  ping: ok
    ? jest.fn().mockResolvedValue(undefined)
    : jest.fn().mockRejectedValue(new Error('redis unreachable')),
});

const buildController = async (opts: { postgres: boolean; redis: boolean }) => {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: PrismaService, useValue: makePrisma(opts.postgres) },
      {
        provide: EphemeralStoreHealthIndicator,
        useValue: makeEphemeral(opts.redis),
      },
    ],
  }).compile();
  return moduleRef.get(HealthController);
};

describe('HealthController', () => {
  it('returns ok when both Postgres and Redis respond', async () => {
    const controller = await buildController({ postgres: true, redis: true });
    const result = await controller.check();
    expect(result).toEqual({ status: 'ok', postgres: 'ok', redis: 'ok' });
  });

  it('throws 503 with postgres down when Postgres query rejects', async () => {
    const controller = await buildController({ postgres: false, redis: true });
    await expect(controller.check()).rejects.toBeInstanceOf(HttpException);
    await controller.check().catch((err: HttpException) => {
      expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(err.getResponse()).toEqual({
        status: 'error',
        postgres: 'down',
        redis: 'ok',
      });
    });
  });

  it('throws 503 with redis down when Redis ping rejects', async () => {
    const controller = await buildController({ postgres: true, redis: false });
    await controller.check().catch((err: HttpException) => {
      expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(err.getResponse()).toEqual({
        status: 'error',
        postgres: 'ok',
        redis: 'down',
      });
    });
  });

  it('throws 503 with both down when Postgres and Redis reject', async () => {
    const controller = await buildController({ postgres: false, redis: false });
    await controller.check().catch((err: HttpException) => {
      expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(err.getResponse()).toEqual({
        status: 'error',
        postgres: 'down',
        redis: 'down',
      });
    });
  });
});
