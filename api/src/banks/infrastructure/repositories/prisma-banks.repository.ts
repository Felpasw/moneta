import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import type {
  Bank,
  BanksRepository,
} from '../../domain/ports/banks-repository';

@Injectable()
export class PrismaBanksRepository implements BanksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listAll(): Promise<Bank[]> {
    const rows = await this.prisma.bank.findMany({
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      compeCode: row.compeCode,
      logoUrl: row.logoUrl,
    }));
  }
}
