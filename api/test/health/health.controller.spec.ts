import { HttpException, HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { EphemeralStoreHealthIndicator } from '~/@common/infrastructure/ephemeral-store/ephemeral-store-health.indicator';
import { ElevenLabsTtsHealthIndicator } from '~/agent/infrastructure/tts/providers/elevenlabs/elevenlabs-tts-health.indicator';
import { OpenAiLlmHealthIndicator } from '~/agent/infrastructure/llm/providers/openai/openai-llm-health.indicator';
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

const makeLlm = (ok: boolean) => ({
  ping: ok
    ? jest.fn().mockResolvedValue(undefined)
    : jest.fn().mockRejectedValue(new Error('llm unreachable')),
});

const makeTts = (ok: boolean) => ({
  ping: ok
    ? jest.fn().mockResolvedValue(undefined)
    : jest.fn().mockRejectedValue(new Error('tts unreachable')),
});

const buildController = async (opts: {
  postgres?: boolean;
  redis?: boolean;
  llm?: boolean;
  tts?: boolean;
}) => {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [
      { provide: PrismaService, useValue: makePrisma(opts.postgres ?? true) },
      {
        provide: EphemeralStoreHealthIndicator,
        useValue: makeEphemeral(opts.redis ?? true),
      },
      {
        provide: OpenAiLlmHealthIndicator,
        useValue: makeLlm(opts.llm ?? true),
      },
      {
        provide: ElevenLabsTtsHealthIndicator,
        useValue: makeTts(opts.tts ?? true),
      },
    ],
  }).compile();
  return moduleRef.get(HealthController);
};

describe('HealthController', () => {
  describe('GET /health', () => {
    it('returns ok when both Postgres and Redis respond', async () => {
      const controller = await buildController({ postgres: true, redis: true });
      const result = await controller.check();
      expect(result).toEqual({ status: 'ok', postgres: 'ok', redis: 'ok' });
    });

    it('throws 503 with postgres down when Postgres query rejects', async () => {
      const controller = await buildController({
        postgres: false,
        redis: true,
      });
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
      const controller = await buildController({
        postgres: true,
        redis: false,
      });
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
      const controller = await buildController({
        postgres: false,
        redis: false,
      });
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

  describe('GET /health/agent', () => {
    it('returns ok when both LLM and TTS respond', async () => {
      const controller = await buildController({ llm: true, tts: true });
      const result = await controller.checkAgent();
      expect(result).toEqual({ status: 'ok', llm: 'ok', tts: 'ok' });
    });

    it('throws 503 with llm down when LLM ping rejects', async () => {
      const controller = await buildController({ llm: false, tts: true });
      await controller.checkAgent().catch((err: HttpException) => {
        expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(err.getResponse()).toEqual({
          status: 'error',
          llm: 'down',
          tts: 'ok',
        });
      });
    });

    it('throws 503 with tts down when TTS ping rejects', async () => {
      const controller = await buildController({ llm: true, tts: false });
      await controller.checkAgent().catch((err: HttpException) => {
        expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(err.getResponse()).toEqual({
          status: 'error',
          llm: 'ok',
          tts: 'down',
        });
      });
    });

    it('throws 503 with both down when LLM and TTS reject', async () => {
      const controller = await buildController({ llm: false, tts: false });
      await controller.checkAgent().catch((err: HttpException) => {
        expect(err.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        expect(err.getResponse()).toEqual({
          status: 'error',
          llm: 'down',
          tts: 'down',
        });
      });
    });
  });
});
