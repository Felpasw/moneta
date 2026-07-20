import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import {
  TRANSFER_CREATED_EVENT,
  type TransferCreatedPayload,
} from '../../../transfers/domain/events/transfer-created.event';
import { InvoiceStatus } from '../../domain/constants/invoice-status';
import {
  INVOICES_REPOSITORY,
  type InvoicesRepository,
} from '../../domain/ports/invoices-repository';

@Injectable()
export class TransferCreatedListener {
  private readonly logger = new Logger(TransferCreatedListener.name);

  constructor(
    @Inject(INVOICES_REPOSITORY)
    private readonly invoices: InvoicesRepository,
    private readonly getAccount: GetAccountByIdUseCase,
  ) {}

  @OnEvent(TRANSFER_CREATED_EVENT)
  async handle(payload: TransferCreatedPayload): Promise<void> {
    const target = await this.getAccount.execute({
      id: payload.toAccountId,
      userId: payload.userId,
    });
    if (!target || target.creditLimit === null) return;

    const closed = await this.invoices.listByAccount(
      payload.toAccountId,
      InvoiceStatus.Closed,
    );
    const match = closed.find((inv) => inv.totalAmount === payload.amount);
    if (!match) return;

    await this.invoices.markPaid(
      match.id,
      payload.occurredAt,
      payload.transferId,
    );
    this.logger.log(
      `auto-marked invoice ${match.id} paid via transfer ${payload.transferId}`,
    );
  }
}
