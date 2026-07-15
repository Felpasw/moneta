import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import type { Server } from 'node:http';
import request from 'supertest';

import { AuthController } from '~/auth/auth.controller';
import { LoginWithPasswordUseCase } from '~/auth/application/use-cases/login-with-password.use-case';
import { LogoutUseCase } from '~/auth/application/use-cases/logout.use-case';
import { RefreshTokensUseCase } from '~/auth/application/use-cases/refresh-tokens.use-case';
import { SignOutEverywhereUseCase } from '~/auth/application/use-cases/sign-out-everywhere.use-case';
import { SignupWithPasswordUseCase } from '~/auth/application/use-cases/signup-with-password.use-case';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { AUTH_THROTTLER } from '~/auth/infrastructure/constants/throttler';
import { IpEmailThrottlerGuard } from '~/auth/infrastructure/guards/ip-email-throttler.guard';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
}> => {
  const module = await Test.createTestingModule({
    imports: [
      ThrottlerModule.forRoot([
        { ttl: AUTH_THROTTLER.ttl, limit: AUTH_THROTTLER.limit },
      ]),
    ],
    controllers: [AuthController],
    providers: [
      { provide: SignupWithPasswordUseCase, useValue: { execute: jest.fn() } },
      {
        provide: LoginWithPasswordUseCase,
        useValue: { execute: jest.fn().mockRejectedValue(new Error('boom')) },
      },
      {
        provide: RefreshTokensUseCase,
        useValue: {
          execute: jest.fn().mockResolvedValue({
            user: { id: 'user-1', email: 'x@example.com', name: 'X' },
            accessToken: 'access.jwt',
            refreshToken: 'refresh.jwt',
          }),
        },
      },
      { provide: LogoutUseCase, useValue: { execute: jest.fn() } },
      { provide: SignOutEverywhereUseCase, useValue: { execute: jest.fn() } },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
      IpEmailThrottlerGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, http: app.getHttpServer() as Server };
};

const spam = async (http: Server, count: number) => {
  const responses = [];
  for (let i = 0; i < count; i += 1) {
    responses.push(
      await request(http)
        .post('/auth/login')
        .send({ email: 'attacker@example.com', password: 'wrong' }),
    );
  }
  return responses;
};

describe('IpEmailThrottlerGuard', () => {
  let app: INestApplication;
  let http: Server;

  beforeEach(async () => {
    const built = await buildApp();
    app = built.app;
    http = built.http;
  });

  afterEach(async () => {
    await app.close();
  });

  it('allows the first 5 attempts (limit) within the 15min window', async () => {
    const responses = await spam(http, 5);
    for (const res of responses) {
      expect(res.status).not.toBe(429);
    }
  });

  it('returns 429 on the 6th attempt with the same (ip, email) tuple', async () => {
    await spam(http, 5);
    const sixth = await request(http)
      .post('/auth/login')
      .send({ email: 'attacker@example.com', password: 'wrong' });
    expect(sixth.status).toBe(429);
  });

  it('keeps counters independent per email — different email resets the budget', async () => {
    await spam(http, 5);
    const differentEmail = await request(http)
      .post('/auth/login')
      .send({ email: 'other@example.com', password: 'wrong' });
    expect(differentEmail.status).not.toBe(429);
  });

  it('normalizes email casing — mixed case counts as the same bucket', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(http)
        .post('/auth/login')
        .send({ email: 'Attacker@Example.com', password: 'wrong' });
    }
    const sixth = await request(http)
      .post('/auth/login')
      .send({ email: 'ATTACKER@EXAMPLE.COM', password: 'wrong' });
    expect(sixth.status).toBe(429);
  });

  it('refresh endpoint (no email in body) throttles by IP alone', async () => {
    const responses = [];
    for (let i = 0; i < 5; i += 1) {
      responses.push(
        await request(http)
          .post('/auth/refresh')
          .send({ refreshToken: 'anything' }),
      );
    }
    const sixth = await request(http)
      .post('/auth/refresh')
      .send({ refreshToken: 'anything' });
    expect(sixth.status).toBe(429);
  });
});
