import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import type { Server } from 'node:http';
import request from 'supertest';

import { AuthPasskeyBeginUseCase } from '~/auth/application/use-cases/auth-passkey-begin.use-case';
import { AuthPasskeyFinishUseCase } from '~/auth/application/use-cases/auth-passkey-finish.use-case';
import { EnrollPasskeyBeginUseCase } from '~/auth/application/use-cases/enroll-passkey-begin.use-case';
import { EnrollPasskeyFinishUseCase } from '~/auth/application/use-cases/enroll-passkey-finish.use-case';
import {
  PasskeyAuthenticationFailedError,
  PasskeyAuthenticationFailedReason,
} from '~/auth/domain/errors/passkey-authentication-failed.error';
import {
  PasskeyEnrollmentFailedError,
  PasskeyEnrollmentFailedReason,
} from '~/auth/domain/errors/passkey-enrollment-failed.error';
import { UserNotFoundError } from '~/auth/domain/errors/user-not-found.error';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { IpEmailThrottlerGuard } from '~/auth/infrastructure/guards/ip-email-throttler.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { PasskeyController } from '~/auth/passkey.controller';

const REFRESH_COOKIE_NAME = 'refresh_token';

interface Mocks {
  enrollBegin: { execute: jest.Mock };
  enrollFinish: { execute: jest.Mock };
  authBegin: { execute: jest.Mock };
  authFinish: { execute: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    enrollBegin: { execute: jest.fn() },
    enrollFinish: { execute: jest.fn() },
    authBegin: { execute: jest.fn() },
    authFinish: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [PasskeyController],
    providers: [
      { provide: EnrollPasskeyBeginUseCase, useValue: mocks.enrollBegin },
      { provide: EnrollPasskeyFinishUseCase, useValue: mocks.enrollFinish },
      { provide: AuthPasskeyBeginUseCase, useValue: mocks.authBegin },
      { provide: AuthPasskeyFinishUseCase, useValue: mocks.authFinish },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
    ],
  })
    .overrideGuard(IpEmailThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();

  const app = module.createNestApplication();
  app.use(cookieParser());
  await app.init();

  const tokens = new JwtTokenService();
  const accessToken = tokens.signAccess({ sub: 'user-1' });

  return {
    app,
    http: app.getHttpServer() as Server,
    mocks,
    accessToken,
  };
};

const findCookie = (setCookieHeader: string | string[], name: string) => {
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  return headers.find((h) => h.startsWith(`${name}=`));
};

describe('PasskeyController', () => {
  let app: INestApplication;
  let http: Server;
  let mocks: Mocks;
  let accessToken: string;

  beforeEach(async () => {
    const built = await buildApp();
    app = built.app;
    http = built.http;
    mocks = built.mocks;
    accessToken = built.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/passkey/enroll/begin', () => {
    it('returns 200 with registration options when authenticated', async () => {
      mocks.enrollBegin.execute.mockResolvedValue({
        challenge: 'reg-challenge',
        rp: { id: 'localhost', name: 'Moneta' },
      });

      const res = await request(http)
        .post('/auth/passkey/enroll/begin')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(mocks.enrollBegin.execute).toHaveBeenCalledWith({
        userId: 'user-1',
      });
      expect(res.body).toMatchObject({ challenge: 'reg-challenge' });
    });

    it('returns 401 without Authorization header', async () => {
      const res = await request(http).post('/auth/passkey/enroll/begin');
      expect(res.status).toBe(401);
      expect(mocks.enrollBegin.execute).not.toHaveBeenCalled();
    });

    it('returns 404 when the use-case throws UserNotFoundError', async () => {
      mocks.enrollBegin.execute.mockRejectedValue(
        new UserNotFoundError('user-1'),
      );

      const res = await request(http)
        .post('/auth/passkey/enroll/begin')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('POST /auth/passkey/enroll/finish', () => {
    it('returns 204 on successful enrollment', async () => {
      mocks.enrollFinish.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .post('/auth/passkey/enroll/finish')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ response: { id: 'cred-1', extra: 'stuff' } });

      expect(res.status).toBe(204);
      expect(mocks.enrollFinish.execute).toHaveBeenCalledWith({
        userId: 'user-1',
        response: { id: 'cred-1', extra: 'stuff' },
      });
    });

    it('returns 400 on PasskeyEnrollmentFailedError', async () => {
      mocks.enrollFinish.execute.mockRejectedValue(
        new PasskeyEnrollmentFailedError(
          PasskeyEnrollmentFailedReason.CHALLENGE_NOT_FOUND,
        ),
      );

      const res = await request(http)
        .post('/auth/passkey/enroll/finish')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ response: { id: 'cred-1' } });

      expect(res.status).toBe(400);
    });

    it('returns 400 when body is invalid (missing response.id)', async () => {
      const res = await request(http)
        .post('/auth/passkey/enroll/finish')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ response: {} });

      expect(res.status).toBe(400);
      expect(mocks.enrollFinish.execute).not.toHaveBeenCalled();
    });

    it('returns 401 without Authorization header', async () => {
      const res = await request(http)
        .post('/auth/passkey/enroll/finish')
        .send({ response: { id: 'cred-1' } });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/passkey/login/begin', () => {
    it('returns 200 with sessionId + options (usernameless)', async () => {
      mocks.authBegin.execute.mockResolvedValue({
        sessionId: 'session-uuid',
        options: { challenge: 'auth-challenge', allowCredentials: [] },
      });

      const res = await request(http)
        .post('/auth/passkey/login/begin')
        .send({});

      expect(res.status).toBe(200);
      expect(mocks.authBegin.execute).toHaveBeenCalledWith({
        email: undefined,
      });
      expect(res.body).toMatchObject({ sessionId: 'session-uuid' });
    });

    it('accepts an email hint', async () => {
      mocks.authBegin.execute.mockResolvedValue({
        sessionId: 'session-uuid',
        options: { challenge: 'auth-challenge', allowCredentials: [] },
      });

      const res = await request(http)
        .post('/auth/passkey/login/begin')
        .send({ email: 'alice@example.com' });

      expect(res.status).toBe(200);
      expect(mocks.authBegin.execute).toHaveBeenCalledWith({
        email: 'alice@example.com',
      });
    });

    it('returns 400 when email is present but malformed', async () => {
      const res = await request(http)
        .post('/auth/passkey/login/begin')
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(mocks.authBegin.execute).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/passkey/login/finish', () => {
    it('returns 200 with tokens + user snapshot and sets refresh cookie', async () => {
      mocks.authFinish.execute.mockResolvedValue({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'new.refresh.jwt',
      });

      const res = await request(http)
        .post('/auth/passkey/login/finish')
        .send({
          sessionId: 'session-uuid',
          response: { id: 'cred-1' },
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'new.refresh.jwt',
      });
      const cookie = findCookie(res.headers['set-cookie'], REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('new.refresh.jwt');
      expect(cookie).toContain('HttpOnly');
    });

    it('returns 401 on PasskeyAuthenticationFailedError', async () => {
      mocks.authFinish.execute.mockRejectedValue(
        new PasskeyAuthenticationFailedError(
          PasskeyAuthenticationFailedReason.VERIFICATION_FAILED,
        ),
      );

      const res = await request(http)
        .post('/auth/passkey/login/finish')
        .send({
          sessionId: 'session-uuid',
          response: { id: 'cred-1' },
        });

      expect(res.status).toBe(401);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('returns 400 when body is missing sessionId', async () => {
      const res = await request(http)
        .post('/auth/passkey/login/finish')
        .send({
          response: { id: 'cred-1' },
        });

      expect(res.status).toBe(400);
      expect(mocks.authFinish.execute).not.toHaveBeenCalled();
    });
  });
});
