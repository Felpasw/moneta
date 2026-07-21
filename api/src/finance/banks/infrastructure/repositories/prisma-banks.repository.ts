import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import type {
  Bank,
  BanksRepository,
} from '../../domain/ports/banks-repository';

@Injectable()
export class PrismaBanksRepository implements BanksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<Bank[]> {
    return this.prisma.bank.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, compeCode: true, logoUrl: true },
    });
  }
}
