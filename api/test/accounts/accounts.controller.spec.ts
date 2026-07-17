import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { AccountsController } from '~/accounts/accounts.controller';
import { AddBankAccountUseCase } from '~/accounts/application/use-cases/add-bank-account.use-case';
import { DeleteBankAccountUseCase } from '~/accounts/application/use-cases/delete-bank-account.use-case';
import { ListMyAccountsUseCase } from '~/accounts/application/use-cases/list-my-accounts.use-case';
import { SetBalanceUseCase } from '~/accounts/application/use-cases/set-balance.use-case';
import { UpdateBankAccountUseCase } from '~/accounts/application/use-cases/update-bank-account.use-case';
import { AccountNotFoundError } from '~/accounts/domain/errors/account-not-found.error';
import { InvalidCreditCardConfigError } from '~/accounts/domain/errors/invalid-credit-card-config.error';
import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';

interface Mocks {
  list: { execute: jest.Mock };
  add: { execute: jest.Mock };
  update: { execute: jest.Mock };
  delete: { execute: jest.Mock };
  setBalance: { execute: jest.Mock };
}

const USER_ID = 'user-1';
const BANK_ID = 'a4b1c1e0-0000-4000-8000-000000000001';
const ACCOUNT_ID = 'a4b1c1e0-0000-4000-8000-000000000002';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    list: { execute: jest.fn() },
    add: { execute: jest.fn() },
    update: { execute: jest.fn() },
    delete: { execute: jest.fn() },
    setBalance: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [AccountsController],
    providers: [
      { provide: ListMyAccountsUseCase, useValue: mocks.list },
      { provide: AddBankAccountUseCase, useValue: mocks.add },
      { provide: UpdateBankAccountUseCase, useValue: mocks.update },
      { provide: DeleteBankAccountUseCase, useValue: mocks.delete },
      { provide: SetBalanceUseCase, useValue: mocks.setBalance },
      { provide: TOKEN_SERVICE, useClass: JwtTokenService },
      JwtAuthGuard,
    ],
  }).compile();

  const app = module.createNestApplication();
  await app.init();

  const tokens = new JwtTokenService();
  const accessToken = tokens.signAccess({ sub: USER_ID });

  return {
    app,
    http: app.getHttpServer() as Server,
    mocks,
    accessToken,
  };
};

const bearer = (token: string): [string, string] => [
  'Authorization',
  `Bearer ${token}`,
];

describe('AccountsController', () => {
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

  describe('GET /accounts', () => {
    it('returns 401 without an access token', async () => {
      const res = await request(http).get('/accounts');
      expect(res.status).toBe(401);
    });

    it('returns 200 with the accounts of the current user', async () => {
      const accounts = [
        {
          id: ACCOUNT_ID,
          userId: USER_ID,
          bankId: BANK_ID,
          nickname: 'Nubank',
          balance: 0,
          creditLimit: null,
          overdraftLimit: null,
          closeDay: null,
          dueDay: null,
        },
      ];
      mocks.list.execute.mockResolvedValue(accounts);

      const res = await request(http)
        .get('/accounts')
        .set(...bearer(accessToken));

      expect(res.status).toBe(200);
      expect(res.body).toEqual(accounts);
      expect(mocks.list.execute).toHaveBeenCalledWith({ userId: USER_ID });
    });
  });

  describe('POST /accounts', () => {
    it('returns 201 with the created account', async () => {
      const created = {
        id: ACCOUNT_ID,
        userId: USER_ID,
        bankId: BANK_ID,
        nickname: 'Nubank',
        balance: 100,
        creditLimit: null,
        overdraftLimit: null,
        closeDay: null,
        dueDay: null,
      };
      mocks.add.execute.mockResolvedValue(created);

      const res = await request(http)
        .post('/accounts')
        .set(...bearer(accessToken))
        .send({ bankId: BANK_ID, nickname: 'Nubank', initialBalance: 100 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(created);
      expect(mocks.add.execute).toHaveBeenCalledWith({
        userId: USER_ID,
        bankId: BANK_ID,
        nickname: 'Nubank',
        initialBalance: 100,
      });
    });

    it('returns 400 when the use-case throws InvalidCreditCardConfigError', async () => {
      mocks.add.execute.mockRejectedValue(new InvalidCreditCardConfigError());

      const res = await request(http)
        .post('/accounts')
        .set(...bearer(accessToken))
        .send({ bankId: BANK_ID, nickname: 'Itau', creditLimit: 5000 });

      expect(res.status).toBe(400);
    });

    it('returns 400 when the payload fails Zod validation', async () => {
      const res = await request(http)
        .post('/accounts')
        .set(...bearer(accessToken))
        .send({ bankId: 'not-a-uuid', nickname: 'x' });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /accounts/:id', () => {
    it('returns 200 with the updated account', async () => {
      const updated = {
        id: ACCOUNT_ID,
        userId: USER_ID,
        bankId: BANK_ID,
        nickname: 'Novo Nome',
        balance: 100,
        creditLimit: null,
        overdraftLimit: null,
        closeDay: null,
        dueDay: null,
      };
      mocks.update.execute.mockResolvedValue(updated);

      const res = await request(http)
        .patch(`/accounts/${ACCOUNT_ID}`)
        .set(...bearer(accessToken))
        .send({ nickname: 'Novo Nome' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(mocks.update.execute).toHaveBeenCalledWith({
        id: ACCOUNT_ID,
        userId: USER_ID,
        nickname: 'Novo Nome',
      });
    });

    it('returns 404 when the account is not found for the user', async () => {
      mocks.update.execute.mockRejectedValue(
        new AccountNotFoundError(ACCOUNT_ID),
      );

      const res = await request(http)
        .patch(`/accounts/${ACCOUNT_ID}`)
        .set(...bearer(accessToken))
        .send({ nickname: 'x' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /accounts/:id', () => {
    it('returns 204 on success', async () => {
      mocks.delete.execute.mockResolvedValue(undefined);

      const res = await request(http)
        .delete(`/accounts/${ACCOUNT_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(204);
      expect(mocks.delete.execute).toHaveBeenCalledWith({
        id: ACCOUNT_ID,
        userId: USER_ID,
      });
    });

    it('returns 404 when the account is not found for the user', async () => {
      mocks.delete.execute.mockRejectedValue(
        new AccountNotFoundError(ACCOUNT_ID),
      );

      const res = await request(http)
        .delete(`/accounts/${ACCOUNT_ID}`)
        .set(...bearer(accessToken));

      expect(res.status).toBe(404);
    });
  });

  describe('POST /accounts/:id/balance', () => {
    it('returns 201 with the updated account snapshot', async () => {
      const updated = {
        id: ACCOUNT_ID,
        userId: USER_ID,
        bankId: BANK_ID,
        nickname: 'Nubank',
        balance: 250.5,
        creditLimit: null,
        overdraftLimit: null,
        closeDay: null,
        dueDay: null,
      };
      mocks.setBalance.execute.mockResolvedValue(updated);

      const res = await request(http)
        .post(`/accounts/${ACCOUNT_ID}/balance`)
        .set(...bearer(accessToken))
        .send({ amount: 250.5 });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(updated);
      expect(mocks.setBalance.execute).toHaveBeenCalledWith({
        id: ACCOUNT_ID,
        userId: USER_ID,
        amount: 250.5,
      });
    });

    it('returns 404 when the account is not found for the user', async () => {
      mocks.setBalance.execute.mockRejectedValue(
        new AccountNotFoundError(ACCOUNT_ID),
      );

      const res = await request(http)
        .post(`/accounts/${ACCOUNT_ID}/balance`)
        .set(...bearer(accessToken))
        .send({ amount: 100 });

      expect(res.status).toBe(404);
    });
  });
});
