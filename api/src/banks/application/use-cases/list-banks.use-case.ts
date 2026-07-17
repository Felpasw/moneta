import { Inject, Injectable } from '@nestjs/common';

import {
  BANKS_REPOSITORY,
  type Bank,
  type BanksRepository,
} from '../../domain/ports/banks-repository';

@Injectable()
export class ListBanksUseCase {
  constructor(
    @Inject(BANKS_REPOSITORY) private readonly banks: BanksRepository,
  ) {}

  async execute(): Promise<Bank[]> {
    return this.banks.listAll();
  }
}
