import {
  Controller,
  Get,
  type INestApplication,
  Module,
  UseGuards,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { CurrentUser } from '~/auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import type { DecodedToken } from '~/auth/domain/services/token-service';

@Controller('protected')
class ProtectedTestController {
  @Get()
  @UseGuards(JwtAuthGuard)
  handler(@CurrentUser() user: DecodedToken) {
    return { sub: user.sub, iat: user.iat, exp: user.exp };
  }
}

@Module({
  controllers: [ProtectedTestController],
  providers: [
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    JwtAuthGuard,
  ],
})
class ProtectedTestModule {}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  accessToken: string;
}> => {
  const module = await Test.createTestingModule({
    imports: [ProtectedTestModule],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const tokens = new JwtTokenService();
  const accessToken = tokens.signAccess({ sub: 'user-42' });

  return { app, http: app.getHttpServer() as Server, accessToken };
};

describe('JwtAuthGuard + @CurrentUser', () => {
  let app: INestApplication;
  let http: Server;
  let accessToken: string;

  beforeEach(async () => {
    const built = await buildApp();
    app = built.app;
    http = built.http;
    accessToken = built.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('returns 200 with the decoded payload injected via @CurrentUser', async () => {
    const res = await request(http)
      .get('/protected')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sub: 'user-42' });
    expect(typeof (res.body as { iat: number }).iat).toBe('number');
    expect(typeof (res.body as { exp: number }).exp).toBe('number');
  });

  it('returns 401 when Authorization header is absent', async () => {
    const res = await request(http).get('/protected');
    expect(res.status).toBe(401);
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const res = await request(http)
      .get('/protected')
      .set('Authorization', `Basic ${accessToken}`);
    expect(res.status).toBe(401);
  });

  it('returns 401 when the Bearer token is malformed', async () => {
    const res = await request(http)
      .get('/protected')
      .set('Authorization', 'Bearer this-is-not-a-jwt');
    expect(res.status).toBe(401);
  });

  it('returns 401 when the JWT has a valid shape but wrong signature', async () => {
    const forged =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhdHRhY2tlciIsImlhdCI6MTUxNjIzOTAyMn0.wrong-signature';
    const res = await request(http)
      .get('/protected')
      .set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });
});
