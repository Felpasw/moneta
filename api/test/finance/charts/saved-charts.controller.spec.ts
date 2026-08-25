import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { CLOCK } from '~/@common/domain/ports/clock';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { ChartQueryBuilder } from '~/finance/charts/application/services/chart-query-builder';
import { SavedChartNotFoundError } from '~/finance/charts/domain/errors/saved-chart-not-found.error';
import { SAVED_CHARTS_REPOSITORY } from '~/finance/charts/domain/ports/saved-charts-repository';
import { SavedChartsController } from '~/finance/charts/saved-charts.controller';

const USER_ID = 'user-1';
const CHART_ID = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-08-15T14:30:00.000Z');

const spec = {
  chartType: 'bar',
  xAxis: { field: 'category', grouping: 'category' },
  yAxis: { field: 'amount', aggregation: 'sum' },
  filters: { dateRange: { preset: 'this_month' } },
  title: 'Test',
} as const;

interface Mocks {
  repo: {
    add: jest.Mock;
    findById: jest.Mock;
    listSummaries: jest.Mock;
    rename: jest.Mock;
    togglePin: jest.Mock;
    delete: jest.Mock;
  };
  builder: { build: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    repo: {
      add: jest.fn(),
      findById: jest.fn(),
      listSummaries: jest.fn(),
      rename: jest.fn(),
      togglePin: jest.fn(),
      delete: jest.fn(),
    },
    builder: { build: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [SavedChartsController],
    providers: [
      { provide: SAVED_CHARTS_REPOSITORY, useValue: mocks.repo },
      { provide: ChartQueryBuilder, useValue: mocks.builder },
      { provide: CLOCK, useValue: { now: () => NOW } },
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

describe('SavedChartsController', () => {
  it('rejects unauthenticated requests', async () => {
    const { app, http } = await buildApp();
    try {
      await request(http).get('/saved-charts').expect(401);
    } finally {
      await app.close();
    }
  });

  describe('GET /saved-charts', () => {
    it('returns { items } scoped by the token user', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      const items = [
        { id: 'a', name: 'A', spec, pinned: true, updatedAt: NOW },
      ];
      mocks.repo.listSummaries.mockResolvedValue(items);

      try {
        const res = await request(http)
          .get('/saved-charts')
          .set(...bearer(accessToken))
          .expect(200);
        expect(mocks.repo.listSummaries).toHaveBeenCalledWith({
          userId: USER_ID,
        });
        expect((res.body as { items: unknown[] }).items).toHaveLength(1);
      } finally {
        await app.close();
      }
    });
  });

  describe('POST /saved-charts', () => {
    it('saves and returns { id }', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      mocks.repo.add.mockResolvedValue({ id: CHART_ID });

      try {
        const res = await request(http)
          .post('/saved-charts')
          .set(...bearer(accessToken))
          .send({ name: 'Monthly', spec })
          .expect(201);
        expect(res.body).toEqual({ id: CHART_ID });
      } finally {
        await app.close();
      }
    });

    it('rejects invalid spec with 400', async () => {
      const { app, http, accessToken } = await buildApp();
      try {
        await request(http)
          .post('/saved-charts')
          .set(...bearer(accessToken))
          .send({
            name: 'X',
            spec: { ...spec, xAxis: { field: 'password_hash' } },
          })
          .expect(400);
      } finally {
        await app.close();
      }
    });
  });

  describe('POST /saved-charts/:id/run', () => {
    it('returns 404 when the chart does not exist for the user', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      mocks.repo.findById.mockResolvedValue(null);

      try {
        await request(http)
          .post(`/saved-charts/${CHART_ID}/run`)
          .set(...bearer(accessToken))
          .expect(404);
      } finally {
        await app.close();
      }
    });

    it('runs and returns { spec, data, meta }', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      const chartData = { points: [{ x: 'A', y: 1 }], meta: { totalRows: 1 } };
      mocks.repo.findById.mockResolvedValue({
        id: CHART_ID,
        userId: USER_ID,
        name: 'X',
        spec,
        pinned: false,
        createdAt: NOW,
        updatedAt: NOW,
      });
      mocks.builder.build.mockResolvedValue(chartData);

      try {
        const res = await request(http)
          .post(`/saved-charts/${CHART_ID}/run`)
          .set(...bearer(accessToken))
          .expect(200);
        expect(res.body).toMatchObject({
          data: chartData,
          meta: chartData.meta,
        });
      } finally {
        await app.close();
      }
    });
  });

  describe('PATCH /saved-charts/:id/pin', () => {
    it('returns { id, pinned } after flipping', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      mocks.repo.togglePin.mockResolvedValue({ id: CHART_ID, pinned: true });

      try {
        const res = await request(http)
          .patch(`/saved-charts/${CHART_ID}/pin`)
          .set(...bearer(accessToken))
          .expect(200);
        expect(res.body).toEqual({ id: CHART_ID, pinned: true });
      } finally {
        await app.close();
      }
    });

    it('returns 404 when the chart does not belong to the user', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      mocks.repo.togglePin.mockRejectedValue(
        new SavedChartNotFoundError(CHART_ID),
      );

      try {
        await request(http)
          .patch(`/saved-charts/${CHART_ID}/pin`)
          .set(...bearer(accessToken))
          .expect(404);
      } finally {
        await app.close();
      }
    });
  });

  describe('DELETE /saved-charts/:id', () => {
    it('returns 204 on success', async () => {
      const { app, http, mocks, accessToken } = await buildApp();
      mocks.repo.delete.mockResolvedValue(undefined);

      try {
        await request(http)
          .delete(`/saved-charts/${CHART_ID}`)
          .set(...bearer(accessToken))
          .expect(204);
      } finally {
        await app.close();
      }
    });
  });
});
