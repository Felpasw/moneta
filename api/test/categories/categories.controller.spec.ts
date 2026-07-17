import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';

import { TOKEN_SERVICE } from '~/auth/domain/services/token-service';
import { JwtAuthGuard } from '~/auth/infrastructure/guards/jwt-auth.guard';
import { JwtTokenService } from '~/auth/infrastructure/jwt-token.service';
import { AddCategoryUseCase } from '~/categories/application/use-cases/add-category.use-case';
import { DeleteCategoryUseCase } from '~/categories/application/use-cases/delete-category.use-case';
import { ListCategoriesUseCase } from '~/categories/application/use-cases/list-categories.use-case';
import { RenameCategoryUseCase } from '~/categories/application/use-cases/rename-category.use-case';
import { CategoriesController } from '~/categories/categories.controller';
import { CategoryNotFoundError } from '~/categories/domain/errors/category-not-found.error';

interface Mocks {
  list: { execute: jest.Mock };
  add: { execute: jest.Mock };
  rename: { execute: jest.Mock };
  delete: { execute: jest.Mock };
}

const USER_ID = 'user-1';
const CATEGORY_ID = 'b4b1c1e0-0000-4000-8000-000000000003';

const buildApp = async (): Promise<{
  app: INestApplication;
  http: Server;
  mocks: Mocks;
  accessToken: string;
}> => {
  const mocks: Mocks = {
    list: { execute: jest.fn() },
    add: { execute: jest.fn() },
    rename: { execute: jest.fn() },
    delete: { execute: jest.fn() },
  };

  const module = await Test.createTestingModule({
    controllers: [CategoriesController],
    providers: [
      { provide: ListCategoriesUseCase, useValue: mocks.list },
      { provide: AddCategoryUseCase, useValue: mocks.add },
      { provide: RenameCategoryUseCase, useValue: mocks.rename },
      { provide: DeleteCategoryUseCase, useValue: mocks.delete },
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

describe('CategoriesController', () => {
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

  it('GET /categories returns 401 without token', async () => {
    const res = await request(http).get('/categories');
    expect(res.status).toBe(401);
  });

  it('GET /categories returns 200 with the visible categories', async () => {
    mocks.list.execute.mockResolvedValue([
      {
        id: 'g-1',
        userId: null,
        name: 'Alimentação',
        icon: null,
        color: null,
      },
    ]);

    const res = await request(http)
      .get('/categories')
      .set(...bearer(accessToken));

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        id: 'g-1',
        userId: null,
        name: 'Alimentação',
        icon: null,
        color: null,
      },
    ]);
    expect(mocks.list.execute).toHaveBeenCalledWith({ userId: USER_ID });
  });

  it('POST /categories returns 201 with the created custom category', async () => {
    const created = {
      id: CATEGORY_ID,
      userId: USER_ID,
      name: 'Livros',
      icon: null,
      color: null,
    };
    mocks.add.execute.mockResolvedValue(created);

    const res = await request(http)
      .post('/categories')
      .set(...bearer(accessToken))
      .send({ name: 'Livros' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual(created);
    expect(mocks.add.execute).toHaveBeenCalledWith({
      userId: USER_ID,
      name: 'Livros',
    });
  });

  it('PATCH /categories/:id returns 200 on rename', async () => {
    const renamed = {
      id: CATEGORY_ID,
      userId: USER_ID,
      name: 'Livros novos',
      icon: null,
      color: null,
    };
    mocks.rename.execute.mockResolvedValue(renamed);

    const res = await request(http)
      .patch(`/categories/${CATEGORY_ID}`)
      .set(...bearer(accessToken))
      .send({ name: 'Livros novos' });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(renamed);
  });

  it('PATCH /categories/:id returns 404 when the category is not owned', async () => {
    mocks.rename.execute.mockRejectedValue(
      new CategoryNotFoundError(CATEGORY_ID),
    );

    const res = await request(http)
      .patch(`/categories/${CATEGORY_ID}`)
      .set(...bearer(accessToken))
      .send({ name: 'x' });

    expect(res.status).toBe(404);
  });

  it('DELETE /categories/:id returns 204 on success', async () => {
    mocks.delete.execute.mockResolvedValue(undefined);

    const res = await request(http)
      .delete(`/categories/${CATEGORY_ID}`)
      .set(...bearer(accessToken));

    expect(res.status).toBe(204);
  });

  it('DELETE /categories/:id returns 404 when trying to delete a global', async () => {
    mocks.delete.execute.mockRejectedValue(
      new CategoryNotFoundError(CATEGORY_ID),
    );

    const res = await request(http)
      .delete(`/categories/${CATEGORY_ID}`)
      .set(...bearer(accessToken));

    expect(res.status).toBe(404);
  });
});
