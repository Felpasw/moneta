import { Inject, Injectable } from '@nestjs/common';

import { SameAccountTransferError } from '../../domain/errors/same-account-transfer.error';
import {
  TRANSFERS_REPOSITORY,
  type CreateTransferInput,
  type Transfer,
  type TransfersRepository,
} from '../../domain/ports/transfers-repository';

@Injectable()
export class CreateTransferUseCase {
  constructor(
    @Inject(TRANSFERS_REPOSITORY)
    private readonly transfers: TransfersRepository,
  ) {}

  async execute(input: CreateTransferInput): Promise<Transfer> {
    if (input.fromAccountId === input.toAccountId) {
      throw new SameAccountTransferError(input.fromAccountId);
    }
    return this.transfers.create(input);
  }
}
