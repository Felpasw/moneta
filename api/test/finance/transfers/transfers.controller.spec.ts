import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { CreateTransferUseCase } from '~/finance/transfers/application/use-cases/create-transfer.use-case';
import { DeleteTransferUseCase } from '~/finance/transfers/application/use-cases/delete-transfer.use-case';
import { ListTransfersUseCase } from '~/finance/transfers/application/use-cases/list-transfers.use-case';
import { SameAccountTransferError } from '~/finance/transfers/domain/errors/same-account-transfer.error';
import { TransferNotFoundError } from '~/finance/transfers/domain/errors/transfer-not-found.error';
import { TransfersController } from '~/finance/transfers/transfers.controller';

interface Mocks {
  list: { execute: jest.Mock };
  create: { execute: jest.Mock };
  delete: { execute: jest.Mock };
}

const USER_ID = 'user-1';
const FROM_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const TO_ID = 'a4b1c1e0-0000-4000-8000-000000000002';
const TRANSFER_ID = 'a4b1c1e0-0000-4000-8000-000000000003';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    list: { execute: jest.fn() },
    create: { execute: jest.fn() },
    delete: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [TransfersController],
    providers: [
      { provide: ListTransfersUseCase, useValue: mocks.list },
      { provide: CreateTransferUseCase, useValue: mocks.create },
      { provide: DeleteTransferUseCase, useValue: mocks.delete },
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

describe('TransfersController', () => {
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

  describe('GET /transfers', () => {
    it('returns 401 without a token', async () => {
      const res = await request(http).get('/transfers');
      expect(res.status).toBe(401);
    });

    it('parses filters and forwards them (with defaults) to the use-case', async () => {
      mocks.list.execute.mockResolvedValue([]);

      const res = await request(http)
        .get(
          `/transfers?dateFrom=2026-07-01T00:00:00.000Z&accountIds=${FROM_ID}&limit=25`,
        )
        .set(...bearer(accessToken));

      expect(res.status).toBe(200);
      expect(mocks.list.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        dateFrom: new Date('2026-07-01T00:00:00.000Z'),
        accountIds: [FROM_ID],
        limit: 25,
        offset: 0,
      });
    });
  });

  describe('POST /transfers', () => {
    it('returns 201 with the created transfer', async () => {
      const created = {
        id: TRANSFER_ID,
        userId: USER_ID,
        fromAccountId: FROM_ID,
        toAccountId: TO_ID,
        amount: 150,
        description: null,
        occurredAt: OCCURRED_AT,
      };
      mocks.create.execute.mockResolvedValue(created);

      const res = await request(http)
        .post('/transfers')
        .set(...bearer(accessToken))
        .send({
          fromAccountId: FROM_ID,
          toAccountId: TO_ID,
          amount: 150,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(201);
      expect(mocks.create.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        fromAccountId: FROM_ID,
        toAccountId: TO_ID,
        amount: 150,
        occurredAt: new Date(OCCURRED_AT),
      });
    });

    it('returns 400 when fromAccountId equals toAccountId', async () => {
      mocks.create.execute.mockRejectedValue(
        new SameAccountTransferError(FROM_ID),
      );

      const res = await request(http)
        .post('/transfers')
        .set(...bearer(accessToken))
        .send({
          fromAccountId: FROM_ID,
          toAccountId: FROM_ID,
          amount: 10,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(400);
    });

    it('returns 404 when one of the accounts is not owned by the user', async () => {
      mocks.create.execute.mockRejectedValue(new AccountNotFoundError(FROM_ID));

      const res = await request(http)
        .post('/transfers')
        .set(...bearer(accessToken))
        .send({
          fromAccountId: FROM_ID,
          toAccountId: TO_ID,
          amount: 10,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(404);
    });

    it('returns 400 when amount is not positive', async () => {
      const res = await request(http)
        .post('/transfers')
        .set(...bearer(accessToken))
        .send({
          fromAccountId: FROM_ID,
          toAccountId: TO_ID,
          amount: 0,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /transfers/:id', () => {
    it('returns 204 on success', async () => {
      mocks.delete.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .delete(`/transfers/${TRANSFER_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(204);
      expect(mocks.delete.execute).toHaveBeenCalledWith({
        id: TRANSFER_ID,
        userId: USER_ID,
      });
    });

    it('returns 404 when the transfer is not found', async () => {
      mocks.delete.execute.mockRejectedValue(
        new TransferNotFoundError(TRANSFER_ID),
      );

      const res = await request(http)
        .delete(`/transfers/${TRANSFER_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(404);
    });
  });
});
