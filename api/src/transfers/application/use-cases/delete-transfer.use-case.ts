import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSFERS_REPOSITORY,
  type TransfersRepository,
} from '../../domain/ports/transfers-repository';

@Injectable()
export class DeleteTransferUseCase {
  constructor(
    @Inject(TRANSFERS_REPOSITORY)
    private readonly transfers: TransfersRepository,
  ) {}

  async execute(input: { id: string; userId: string }): Promise<void> {
    return this.transfers.delete(input.id, input.userId);
  }
}
