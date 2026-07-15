import { PrismaService } from '~/infrastructure/prisma/prisma.service';

describe('PrismaService', () => {
  it('$connect is called on module init', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledTimes(1);
  });

  it('$disconnect is called on module destroy', async () => {
    const service = new PrismaService();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });
});
