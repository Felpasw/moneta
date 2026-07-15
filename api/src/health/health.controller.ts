import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { EphemeralStoreHealthIndicator } from '../@common/infrastructure/ephemeral-store/ephemeral-store-health.indicator';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

type ProbeStatus = 'ok' | 'down';

interface HealthCheckResult {
  status: 'ok' | 'error';
  postgres: ProbeStatus;
  redis: ProbeStatus;
}

const toStatus = (ok: boolean): ProbeStatus => {
  if (ok) return 'ok';
  return 'down';
};

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ephemeralStore: EphemeralStoreHealthIndicator,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    const [postgresOk, redisOk] = await Promise.all([
      this.probe(() => this.prisma.$queryRaw`SELECT 1`),
      this.probe(() => this.ephemeralStore.ping()),
    ]);

    const postgres = toStatus(postgresOk);
    const redis = toStatus(redisOk);

    if (!postgresOk || !redisOk) {
      throw new HttpException(
        { status: 'error', postgres, redis },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok', postgres, redis };
  }

  private async probe(fn: () => Promise<unknown>): Promise<boolean> {
    try {
      await fn();
      return true;
    } catch {
      return false;
    }
  }
}
