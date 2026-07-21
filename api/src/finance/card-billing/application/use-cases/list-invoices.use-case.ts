import { Inject, Injectable } from '@nestjs/common';

import { AccountNotFoundError } from '../../../accounts/domain/errors/account-not-found.error';
import { GetAccountByIdUseCase } from '../../../accounts/application/use-cases/get-account-by-id.use-case';
import type { InvoiceStatus } from '../../domain/constants/invoice-status';
import {
  INVOICES_REPOSITORY,
  type Invoice,
  type InvoicesRepository,
} from '../../domain/ports/invoices-repository';

@Injectable()
export class ListInvoicesUseCase {
  constructor(
    @Inject(INVOICES_REPOSITORY)
    private readonly invoices: InvoicesRepository,
    private readonly getAccount: GetAccountByIdUseCase,
  ) {}

  async execute(input: {
    accountId: string;
    userId: string;
    status?: InvoiceStatus;
  }): Promise<Invoice[]> {
    const account = await this.getAccount.execute({
      id: input.accountId,
      userId: input.userId,
    });
    if (!account) throw new AccountNotFoundError(input.accountId);
    return this.invoices.listByAccount(input.accountId, input.status);
  }
}
