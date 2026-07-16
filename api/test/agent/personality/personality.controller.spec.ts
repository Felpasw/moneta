import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { GetAssistantProfileUseCase } from '~/agent/personality/application/use-cases/get-assistant-profile.use-case';
import { UpdateAssistantProfileUseCase } from '~/agent/personality/application/use-cases/update-assistant-profile.use-case';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import { ProfileNotFoundError } from '~/agent/personality/domain/errors/profile-not-found.error';
import { PersonalityController } from '~/agent/personality/personality.controller';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';

interface Mocks {
  get: { execute: jest.Mock };
  update: { execute: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
}> => {
  const mocks: Mocks = {
    get: { execute: jest.fn() },
    update: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [PersonalityController],
    providers: [
      { provide: GetAssistantProfileUseCase, useValue: mocks.get },
      { provide: UpdateAssistantProfileUseCase, useValue: mocks.update },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, http: app.getHttpServer() as Server, mocks };
};

const bearer = (sub: string): string => {
  const tokens = new JwtTokenService();
  return `Bearer ${tokens.signAccess({ sub })}`;
};

const PROFILE = {
  id: 'p-1',
  userId: 'u-1',
  treatmentStyle: TreatmentStyle.Informal,
  voiceId: 'v-1',
  avatarUrl: null,
  createdAt: new Date('2026-07-16T10:00:00Z').toISOString(),
  updatedAt: new Date('2026-07-16T10:00:00Z').toISOString(),
};

describe('PersonalityController', () => {
  let app: INestApplication;
  let http: Server;
  let mocks: Mocks;

  beforeEach(async () => {
    ({ app, http, mocks } = await buildApp());
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /agent/profile', () => {
    it('returns the current user profile when authenticated', async () => {
      mocks.get.execute.mockResolvedValue(PROFILE);

      const res = await request(http)
        .get('/agent/profile')
        .set('Authorization', bearer('u-1'));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(PROFILE);
      expect(mocks.get.execute).toHaveBeenCalledWith('u-1');
    });

    it('returns 401 without a Bearer token', async () => {
      const res = await request(http).get('/agent/profile');
      expect(res.status).toBe(401);
    });

    it('returns 404 when the profile is missing', async () => {
      mocks.get.execute.mockRejectedValue(new ProfileNotFoundError('u-1'));

      const res = await request(http)
        .get('/agent/profile')
        .set('Authorization', bearer('u-1'));

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /agent/profile', () => {
    it('applies a partial patch and returns the updated profile', async () => {
      const updated = { ...PROFILE, treatmentStyle: TreatmentStyle.Formal };
      mocks.update.execute.mockResolvedValue(updated);

      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ treatmentStyle: 'formal' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(mocks.update.execute).toHaveBeenCalledWith('u-1', {
        treatmentStyle: 'formal',
      });
    });

    it('returns 401 without a Bearer token', async () => {
      const res = await request(http)
        .patch('/agent/profile')
        .send({ voiceId: 'v' });
      expect(res.status).toBe(401);
      expect(mocks.update.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when treatmentStyle is not one of the three enum values', async () => {
      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ treatmentStyle: 'casual' });
      expect(res.status).toBe(400);
      expect(mocks.update.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when avatarUrl is not a Ready Player Me asset', async () => {
      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ avatarUrl: 'https://evil.example.com/x.glb' });
      expect(res.status).toBe(400);
    });

    it('accepts null avatarUrl (clears the avatar)', async () => {
      mocks.update.execute.mockResolvedValue({ ...PROFILE, avatarUrl: null });

      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ avatarUrl: null });

      expect(res.status).toBe(200);
      expect(mocks.update.execute).toHaveBeenCalledWith('u-1', {
        avatarUrl: null,
      });
    });

    it('returns 400 when an unknown field is sent (strict schema)', async () => {
      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ hackField: 'x' });
      expect(res.status).toBe(400);
    });

    it('returns 404 when the profile does not exist', async () => {
      mocks.update.execute.mockRejectedValue(new ProfileNotFoundError('u-1'));

      const res = await request(http)
        .patch('/agent/profile')
        .set('Authorization', bearer('u-1'))
        .send({ voiceId: 'v-new' });

      expect(res.status).toBe(404);
    });
  });
});
