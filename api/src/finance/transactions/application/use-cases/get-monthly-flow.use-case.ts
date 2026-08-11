import { Inject, Injectable } from '@nestjs/common';

import {
  TRANSACTIONS_REPOSITORY,
  type GetMonthlyFlowInput,
  type MonthlyFlowRow,
  type TransactionsRepository,
} from '../../domain/ports/transactions-repository';

@Injectable()
export class GetMonthlyFlowUseCase {
  constructor(
    @Inject(TRANSACTIONS_REPOSITORY)
    private readonly transactions: TransactionsRepository,
  ) {}

  async execute(input: GetMonthlyFlowInput): Promise<MonthlyFlowRow[]> {
    return this.transactions.getMonthlyFlow(input);
  }
}
