import { ConfigService } from '@nestjs/config';

import { PrismaService } from '~/infrastructure/prisma/prisma.service';

const makeConfig = (url: string): ConfigService =>
  ({ getOrThrow: jest.fn().mockReturnValue(url) }) as unknown as ConfigService;

describe('PrismaService', () => {
  it('$connect is called on module init', async () => {
    const service = new PrismaService(makeConfig('postgres://u:p@h:5432/db'));
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('$disconnect is called on module destroy', async () => {
    const service = new PrismaService(makeConfig('postgres://u:p@h:5432/db'));
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
