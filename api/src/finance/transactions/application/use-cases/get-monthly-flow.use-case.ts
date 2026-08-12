import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTIONS_REPOSITORY,
  type GetMonthlyFlowInput,
  type MonthlyFlowResult,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class GetMonthlyFlowUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(input: GetMonthlyFlowInput): Promise<MonthlyFlowResult> {
    return this.transactions.getMonthlyFlow(input);
  }
}
