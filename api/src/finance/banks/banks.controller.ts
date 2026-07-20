import { Controller, Get } from '@nestjs/common';

import { ListBanksUseCase } from './application/use-cases/list-banks.use-case';
import type { Bank } from './domain/ports/banks-repository';

@Controller('banks')
export class BanksController {
  constructor(private readonly listBanks: ListBanksUseCase) {}

  @Get()
  async list(): Promise<Bank[]> {
    return this.listBanks.execute();
  }
}
