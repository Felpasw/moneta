import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSFERS_REPOSITORY,
  type ListTransfersFilters,
  type Transfer,
  type TransfersRepository,
} from '../../domain/ports/transfers-repository';

@Injectable()
export class ListTransfersUseCase {
  constructor(
    @Inject(TRANSFERS_REPOSITORY)
    private readonly transfers: TransfersRepository,
  ) {}

  async execute(filters: ListTransfersFilters): Promise<Transfer[]> {
    return this.transfers.list(filters);
  }
}
