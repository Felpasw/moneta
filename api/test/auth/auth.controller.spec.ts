import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
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
import { InvalidCredentialsError } from '~/auth/domain/errors/invalid-credentials.error';
import { InvalidNameError } from '~/auth/domain/errors/invalid-name.error';
import {
  InvalidRefreshTokenError,
  InvalidRefreshTokenReason,
} from '~/auth/domain/errors/invalid-refresh-token.error';
import { IpEmailThrottlerGuard } from '~/auth/infrastructure/guards/ip-email-throttler.guard';
import { EmailAlreadyRegisteredError } from '~/users/domain/errors/email-already-registered.error';

const REFRESH_COOKIE_NAME = 'refresh_token';

interface Mocks {
  signup: { execute: jest.Mock };
  login: { execute: jest.Mock };
  refresh: { execute: jest.Mock };
  logout: { execute: jest.Mock };
  signOutEverywhere: { execute: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
}> => {
  const mocks: Mocks = {
    signup: { execute: jest.fn() },
    login: { execute: jest.fn() },
    refresh: { execute: jest.fn() },
    logout: { execute: jest.fn() },
    signOutEverywhere: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [AuthController],
    providers: [
      { provide: SignupWithPasswordUseCase, useValue: mocks.signup },
      { provide: LoginWithPasswordUseCase, useValue: mocks.login },
      { provide: RefreshTokensUseCase, useValue: mocks.refresh },
      { provide: LogoutUseCase, useValue: mocks.logout },
      {
        provide: SignOutEverywhereUseCase,
        useValue: mocks.signOutEverywhere,
      },
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

  return { app, http: app.getHttpServer() as Server, mocks };
};

const findCookie = (setCookieHeader: string | string[], name: string) => {
  const headers = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  return headers.find((h) => h.startsWith(`${name}=`));
};

describe('AuthController', () => {
  let app: INestApplication;
  let http: Server;
  let mocks: Mocks;

  beforeEach(async () => {
    const built = await buildApp();
    app = built.app;
    http = built.http;
    mocks = built.mocks;
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('returns 201 with user snapshot on success', async () => {
      mocks.signup.execute.mockResolvedValue({
        id: 'user-1',
        email: 'alice@example.com',
        name: 'Alice',
        onboardedAt: null,
      });

      const res = await request(http).post('/auth/signup').send({
        email: 'alice@example.com',
        password: 'strongpassword',
        name: 'Alice',
      });

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
          onboardedAt: null,
        },
      });
    });

    it('returns 400 when the payload fails Zod validation', async () => {
      const res = await request(http).post('/auth/signup').send({
        email: 'not-an-email',
        password: 'short',
        name: '',
      });

      expect(res.status).toBe(400);
      expect(mocks.signup.execute).not.toHaveBeenCalled();
    });

    it('returns 400 when the use-case throws InvalidNameError', async () => {
      mocks.signup.execute.mockRejectedValue(
        new InvalidNameError('Name must not contain HTML tags'),
      );

      const res = await request(http).post('/auth/signup').send({
        email: 'alice@example.com',
        password: 'strongpassword',
        name: 'Alice <script>alert(1)</script>',
      });

      expect(res.status).toBe(400);
    });

    it('returns 409 when the email is already registered', async () => {
      mocks.signup.execute.mockRejectedValue(
        new EmailAlreadyRegisteredError('alice@example.com'),
      );

      const res = await request(http).post('/auth/signup').send({
        email: 'alice@example.com',
        password: 'strongpassword',
        name: 'Alice',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('returns 200 with token pair and sets refresh cookie on success', async () => {
      mocks.login.execute.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
          onboardedAt: null,
        },
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      });

      const res = await request(http).post('/auth/login').send({
        email: 'alice@example.com',
        password: 'plaintext',
      });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
          onboardedAt: null,
        },
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      });
      const cookie = findCookie(res.headers['set-cookie'], REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('refresh.jwt');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Lax');
      expect(cookie).toContain('Path=/auth/refresh');
    });

    it('propagates a non-null onboardedAt through the login body', async () => {
      const onboardedAt = new Date('2026-01-15T10:00:00.000Z');
      mocks.login.execute.mockResolvedValue({
        user: {
          id: 'user-1',
          email: 'alice@example.com',
          name: 'Alice',
          onboardedAt,
        },
        accessToken: 'access.jwt',
        refreshToken: 'refresh.jwt',
      });

      const res = await request(http).post('/auth/login').send({
        email: 'alice@example.com',
        password: 'plaintext',
      });

      expect(res.status).toBe(200);
      expect(res.body.user.onboardedAt).toBe(onboardedAt.toISOString());
    });

    it('returns 401 on InvalidCredentialsError', async () => {
      mocks.login.execute.mockRejectedValue(new InvalidCredentialsError());

      const res = await request(http).post('/auth/login').send({
        email: 'alice@example.com',
        password: 'wrong',
      });

      expect(res.status).toBe(401);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('returns 400 when body fails Zod validation', async () => {
      const res = await request(http).post('/auth/login').send({
        email: 'not-an-email',
        password: '',
      });

      expect(res.status).toBe(400);
      expect(mocks.login.execute).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/refresh', () => {
    it('reads refresh from cookie and returns new token pair', async () => {
      mocks.refresh.execute.mockResolvedValue({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'new.refresh.jwt',
      });

      const res = await request(http)
        .post('/auth/refresh')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=cookie.refresh.jwt`])
        .send({});

      expect(res.status).toBe(200);
      expect(mocks.refresh.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'cookie.refresh.jwt' }),
      );
      expect(res.body).toMatchObject({ refreshToken: 'new.refresh.jwt' });
    });

    it('reads refresh from body (mobile fallback) when cookie is absent', async () => {
      mocks.refresh.execute.mockResolvedValue({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'new.refresh.jwt',
      });

      const res = await request(http)
        .post('/auth/refresh')
        .send({ refreshToken: 'body.refresh.jwt' });

      expect(res.status).toBe(200);
      expect(mocks.refresh.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'body.refresh.jwt' }),
      );
    });

    it('prefers body refreshToken over cookie when both are present', async () => {
      mocks.refresh.execute.mockResolvedValue({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'new.refresh.jwt',
      });

      const res = await request(http)
        .post('/auth/refresh')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=cookie.refresh.jwt`])
        .send({ refreshToken: 'body.refresh.jwt' });

      expect(res.status).toBe(200);
      expect(mocks.refresh.execute).toHaveBeenCalledWith(
        expect.objectContaining({ refreshToken: 'body.refresh.jwt' }),
      );
    });

    it('returns 401 when no refresh token is present in either cookie or body', async () => {
      const res = await request(http).post('/auth/refresh').send({});

      expect(res.status).toBe(401);
      expect(mocks.refresh.execute).not.toHaveBeenCalled();
    });

    it('returns 401 on InvalidRefreshTokenError with any reason', async () => {
      mocks.refresh.execute.mockRejectedValue(
        new InvalidRefreshTokenError(InvalidRefreshTokenReason.SESSION_REVOKED),
      );

      const res = await request(http)
        .post('/auth/refresh')
        .send({ refreshToken: 'refresh.jwt' });

      expect(res.status).toBe(401);
    });

    it('sets a fresh refresh cookie on successful rotation', async () => {
      mocks.refresh.execute.mockResolvedValue({
        user: { id: 'user-1', email: 'alice@example.com', name: 'Alice' },
        accessToken: 'new.access.jwt',
        refreshToken: 'rotated.refresh.jwt',
      });

      const res = await request(http)
        .post('/auth/refresh')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=old.refresh.jwt`])
        .send({});

      const cookie = findCookie(res.headers['set-cookie'], REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('rotated.refresh.jwt');
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 204 and revokes when refresh is in body', async () => {
      mocks.logout.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .post('/auth/logout')
        .send({ refreshToken: 'body.refresh.jwt' });

      expect(res.status).toBe(204);
      expect(mocks.logout.execute).toHaveBeenCalledWith({
        refreshToken: 'body.refresh.jwt',
      });
    });

    it('returns 204 and revokes when refresh is in cookie', async () => {
      mocks.logout.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .post('/auth/logout')
        .set('Cookie', [`${REFRESH_COOKIE_NAME}=cookie.refresh.jwt`])
        .send({});

      expect(res.status).toBe(204);
      expect(mocks.logout.execute).toHaveBeenCalledWith({
        refreshToken: 'cookie.refresh.jwt',
      });
    });

    it('returns 204 without calling the use-case when no refresh is provided', async () => {
      const res = await request(http).post('/auth/logout').send({});

      expect(res.status).toBe(204);
      expect(mocks.logout.execute).not.toHaveBeenCalled();
    });

    it('clears the refresh cookie in the response', async () => {
      const res = await request(http)
        .post('/auth/logout')
        .send({ refreshToken: 'body.refresh.jwt' });

      const cookie = findCookie(res.headers['set-cookie'], REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('Path=/auth/refresh');
      expect(cookie).toMatch(/Expires=.+1970/);
    });
  });

  describe('POST /auth/logout-everywhere', () => {
    it('revokes all sessions of the authenticated user and returns 204', async () => {
      const tokens = new JwtTokenService();
      const accessToken = tokens.signAccess({ sub: 'user-42' });

      const res = await request(http)
        .post('/auth/logout-everywhere')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(204);
      expect(mocks.signOutEverywhere.execute).toHaveBeenCalledWith({
        userId: 'user-42',
      });
    });

    it('clears the refresh cookie in the response', async () => {
      const tokens = new JwtTokenService();
      const accessToken = tokens.signAccess({ sub: 'user-42' });

      const res = await request(http)
        .post('/auth/logout-everywhere')
        .set('Authorization', `Bearer ${accessToken}`);

      const cookie = findCookie(res.headers['set-cookie'], REFRESH_COOKIE_NAME);
      expect(cookie).toBeDefined();
      expect(cookie).toContain('Path=/auth/refresh');
      expect(cookie).toMatch(/Expires=.+1970/);
    });

    it('returns 401 without a Bearer token', async () => {
      const res = await request(http).post('/auth/logout-everywhere');

      expect(res.status).toBe(401);
      expect(mocks.signOutEverywhere.execute).not.toHaveBeenCalled();
    });
  });
});
