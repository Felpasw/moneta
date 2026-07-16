import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AgentController } from '~/agent/agent.controller';
import { ListAvailableVoicesUseCase } from '~/agent/application/use-cases/list-available-voices.use-case';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';

interface Mocks {
  listVoices: { execute: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
}> => {
  const mocks: Mocks = {
    listVoices: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [AgentController],
    providers: [
      { provide: ListAvailableVoicesUseCase, useValue: mocks.listVoices },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, http: app.getHttpServer() as Server, mocks };
};

describe('AgentController', () => {
  let app: INestApplication;
  let http: Server;
  let mocks: Mocks;

  beforeEach(async () => {
    ({ app, http, mocks } = await buildApp());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /agent/voices', () => {
    it('returns the voices from the use-case for an authenticated request', async () => {
      const voices = [
        { voiceId: 'v1', name: 'Rachel', language: 'en' },
        { voiceId: 'v2', name: 'Carlos', language: 'pt' },
      ];
      mocks.listVoices.execute.mockResolvedValue(voices);
      const tokens = new JwtTokenService();
      const accessToken = tokens.signAccess({ sub: 'user-42' });

      const res = await request(http)
        .get('/agent/voices')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ voices });
      expect(mocks.listVoices.execute).toHaveBeenCalledTimes(1);
    });

    it('returns 401 without a Bearer token', async () => {
      const res = await request(http).get('/agent/voices');

      expect(res.status).toBe(401);
      expect(mocks.listVoices.execute).not.toHaveBeenCalled();
    });
  });
});
