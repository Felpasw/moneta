import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { ListBanksUseCase } from '~/banks/application/use-cases/list-banks.use-case';
import { BanksController } from '~/banks/banks.controller';

interface Mocks {
  listBanks: { execute: jest.Mock };
}

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
}> => {
  const mocks: Mocks = {
    listBanks: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [BanksController],
    providers: [{ provide: ListBanksUseCase, useValue: mocks.listBanks }],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  return { app, http: app.getHttpServer() as Server, mocks };
};

describe('BanksController — GET /banks', () => {
  it('returns 200 with the catalog from ListBanksUseCase', async () => {
    const { app, http, mocks } = await buildApp();
    const catalog = [
      {
        id: 'uuid-1',
        name: 'Banco do Brasil',
        compeCode: '001',
        logoUrl: null,
      },
      { id: 'uuid-2', name: 'Nubank', compeCode: '260', logoUrl: null },
    ];
    mocks.listBanks.execute.mockResolvedValue(catalog);

    const response = await request(http).get('/banks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(catalog);
    expect(mocks.listBanks.execute).toHaveBeenCalledTimes(1);

    await app.close();
  });

  it('returns 200 with empty array when catalog is empty', async () => {
    const { app, http, mocks } = await buildApp();
    mocks.listBanks.execute.mockResolvedValue([]);

    const response = await request(http).get('/banks');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);

    await app.close();
  });
});
