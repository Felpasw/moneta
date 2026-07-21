import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  TRANSFER_CREATED_EVENT,
  type TransferCreatedPayload,
} from '../../domain/events/transfer-created.event';
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
    private readonly events: EventEmitter2,
  ) {}

  async execute(input: CreateTransferInput): Promise<Transfer> {
    if (input.fromAccountId === input.toAccountId) {
      throw new SameAccountTransferError(input.fromAccountId);
    }
    const transfer = await this.transfers.create(input);
    const payload: TransferCreatedPayload = {
      transferId: transfer.id,
      userId: transfer.userId,
      fromAccountId: transfer.fromAccountId,
      toAccountId: transfer.toAccountId,
      amount: transfer.amount,
      occurredAt: transfer.occurredAt,
    };
    this.events.emit(TRANSFER_CREATED_EVENT, payload);
    return transfer;
  }
}
