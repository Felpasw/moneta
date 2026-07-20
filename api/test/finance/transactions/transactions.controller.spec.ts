import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AccountNotFoundError } from '~/finance/accounts/domain/errors/account-not-found.error';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { AddTransactionUseCase } from '~/finance/transactions/application/use-cases/add-transaction.use-case';
import { DeleteTransactionUseCase } from '~/finance/transactions/application/use-cases/delete-transaction.use-case';
import { EditTransactionUseCase } from '~/finance/transactions/application/use-cases/edit-transaction.use-case';
import { ListTransactionsUseCase } from '~/finance/transactions/application/use-cases/list-transactions.use-case';
import { TransactionType } from '~/finance/transactions/domain/constants/transaction-type';
import { TransactionNotFoundError } from '~/finance/transactions/domain/errors/transaction-not-found.error';
import { TransactionsController } from '~/finance/transactions/transactions.controller';

interface Mocks {
  list: { execute: jest.Mock };
  add: { execute: jest.Mock };
  edit: { execute: jest.Mock };
  delete: { execute: jest.Mock };
}

const USER_ID = 'user-1';
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const CATEGORY_ID = 'a4b1c1e0-0000-4000-8000-000000000002';
const TRANSACTION_ID = 'a4b1c1e0-0000-4000-8000-000000000003';
const OCCURRED_AT = '2026-07-15T12:00:00.000Z';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    list: { execute: jest.fn() },
    add: { execute: jest.fn() },
    edit: { execute: jest.fn() },
    delete: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [TransactionsController],
    providers: [
      { provide: ListTransactionsUseCase, useValue: mocks.list },
      { provide: AddTransactionUseCase, useValue: mocks.add },
      { provide: EditTransactionUseCase, useValue: mocks.edit },
      { provide: DeleteTransactionUseCase, useValue: mocks.delete },
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

describe('TransactionsController', () => {
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

  describe('GET /transactions', () => {
    it('returns 401 without a token', async () => {
      const res = await request(http).get('/transactions');
      expect(res.status).toBe(401);
    });

    it('parses filters and forwards them (with defaults) to the use-case', async () => {
      mocks.list.execute.mockResolvedValue([]);

      const res = await request(http)
        .get(
          '/transactions?dateFrom=2026-07-01T00:00:00.000Z&types=expense&types=income&limit=25',
        )
        .set(...bearer(accessToken));

      expect(res.status).toBe(200);
      expect(mocks.list.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        dateFrom: new Date('2026-07-01T00:00:00.000Z'),
        types: [TransactionType.Expense, TransactionType.Income],
        limit: 25,
        offset: 0,
      });
    });
  });

  describe('POST /transactions', () => {
    it('returns 201 with the created transaction', async () => {
      const created = {
        id: TRANSACTION_ID,
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        categoryId: CATEGORY_ID,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: 42.5,
        description: 'Almoço',
        occurredAt: OCCURRED_AT,
      };
      mocks.add.execute.mockResolvedValue(created);

      const res = await request(http)
        .post('/transactions')
        .set(...bearer(accessToken))
        .send({
          accountId: ACCOUNT_ID,
          categoryId: CATEGORY_ID,
          type: 'expense',
          amount: 42.5,
          description: 'Almoço',
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(201);
      expect(mocks.add.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        categoryId: CATEGORY_ID,
        type: TransactionType.Expense,
        amount: 42.5,
        description: 'Almoço',
        occurredAt: new Date(OCCURRED_AT),
      });
    });

    it('returns 404 when the account is not owned by the user', async () => {
      mocks.add.execute.mockRejectedValue(new AccountNotFoundError(ACCOUNT_ID));

      const res = await request(http)
        .post('/transactions')
        .set(...bearer(accessToken))
        .send({
          accountId: ACCOUNT_ID,
          type: 'expense',
          amount: 10,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(404);
    });

    it('returns 400 when amount is not positive', async () => {
      const res = await request(http)
        .post('/transactions')
        .set(...bearer(accessToken))
        .send({
          accountId: ACCOUNT_ID,
          type: 'expense',
          amount: -1,
          occurredAt: OCCURRED_AT,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /transactions/:id', () => {
    it('returns 200 with the updated transaction', async () => {
      const updated = {
        id: TRANSACTION_ID,
        userId: USER_ID,
        accountId: ACCOUNT_ID,
        categoryId: null,
        invoiceId: null,
        type: TransactionType.Expense,
        amount: 55,
        description: 'iFood',
        occurredAt: OCCURRED_AT,
      };
      mocks.edit.execute.mockResolvedValue(updated);

      const res = await request(http)
        .patch(`/transactions/${TRANSACTION_ID}`)
        .set(...bearer(accessToken))
        .send({ amount: 55 });

      expect(res.status).toBe(200);
      expect(mocks.edit.execute).toHaveBeenCalledWith({
        id: TRANSACTION_ID,
        userId: USER_ID,
        amount: 55,
      });
    });

    it('returns 404 when the transaction is not found', async () => {
      mocks.edit.execute.mockRejectedValue(
        new TransactionNotFoundError(TRANSACTION_ID),
      );

      const res = await request(http)
        .patch(`/transactions/${TRANSACTION_ID}`)
        .set(...bearer(accessToken))
        .send({ amount: 55 });

      expect(res.status).toBe(404);
    });

    it('returns 404 when moving to an unowned account', async () => {
      mocks.edit.execute.mockRejectedValue(new AccountNotFoundError('other'));

      const res = await request(http)
        .patch(`/transactions/${TRANSACTION_ID}`)
        .set(...bearer(accessToken))
        .send({ accountId: '00000000-0000-4000-8000-000000000099' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('returns 204 on success', async () => {
      mocks.delete.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .delete(`/transactions/${TRANSACTION_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(204);
      expect(mocks.delete.execute).toHaveBeenCalledWith({
        id: TRANSACTION_ID,
        userId: USER_ID,
      });
    });

    it('returns 404 when the transaction is not found', async () => {
      mocks.delete.execute.mockRejectedValue(
        new TransactionNotFoundError(TRANSACTION_ID),
      );

      const res = await request(http)
        .delete(`/transactions/${TRANSACTION_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(404);
    });
  });
});
