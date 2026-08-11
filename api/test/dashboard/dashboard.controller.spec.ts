import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { GetDashboardViewUseCase } from '~/dashboard/application/use-cases/get-dashboard-view.use-case';
import { DashboardController } from '~/dashboard/dashboard.controller';

interface Mocks {
  getView: { execute: jest.Mock };
}

const USER_ID = 'user-1';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    getView: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [DashboardController],
    providers: [
      { provide: GetDashboardViewUseCase, useValue: mocks.getView },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const tokens = new JwtTokenService();
  return {
    app,
    http: app.getHttpServer() as Server,
    mocks,
    accessToken: tokens.signAccess({ sub: USER_ID }),
  };
};

const bearer = (token: string): [string, string] => [
  'Authorization',
  `Bearer ${token}`,
];

describe('DashboardController', () => {
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

  describe('GET /dashboard/view', () => {
    it('returns 401 without a token', async () => {
      const res = await request(http).get('/dashboard/view');
      expect(res.status).toBe(401);
    });

    it('returns 200 with the view payload and forwards userId from JWT', async () => {
      const view = {
        summary: {
          totalBalance: 1200,
          monthIncome: 3000,
          monthExpense: 1800,
          monthNet: 1200,
        },
        topCategories: [
          {
            id: 'c-1',
            name: 'Food',
            icon: null,
            color: null,
            spent: 500,
            share: 0.28,
          },
        ],
      };
      mocks.getView.execute.mockResolvedValue(view);

      const res = await request(http)
        .get('/dashboard/view')
        .set(...bearer(accessToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(view);
      expect(mocks.getView.execute).toHaveBeenCalledWith({ userId: USER_ID });
    });
  });
});
