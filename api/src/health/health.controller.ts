import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';

import { EphemeralStoreHealthIndicator } from '../@common/infrastructure/ephemeral-store/ephemeral-store-health.indicator';
import { ElevenLabsTtsHealthIndicator } from '../agent/infrastructure/tts/providers/elevenlabs/elevenlabs-tts-health.indicator';
import { OpenAiLlmHealthIndicator } from '../agent/infrastructure/llm/providers/openai/openai-llm-health.indicator';
import { PrismaService } from '../infrastructure/prisma/prisma.service';

type ProbeStatus = 'ok' | 'down';

interface HealthCheckResult {
  status: 'ok' | 'error';
  postgres: ProbeStatus;
  redis: ProbeStatus;
}

interface AgentHealthCheckResult {
  status: 'ok' | 'error';
  llm: ProbeStatus;
  tts: ProbeStatus;
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
    private readonly llmHealth: OpenAiLlmHealthIndicator,
    private readonly ttsHealth: ElevenLabsTtsHealthIndicator,
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

  @Get('agent')
  async checkAgent(): Promise<AgentHealthCheckResult> {
    const [llmOk, ttsOk] = await Promise.all([
      this.probe(() => this.llmHealth.ping()),
      this.probe(() => this.ttsHealth.ping()),
    ]);

    const llm = toStatus(llmOk);
    const tts = toStatus(ttsOk);

    if (!llmOk || !ttsOk) {
      throw new HttpException(
        { status: 'error', llm, tts },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok', llm, tts };
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
