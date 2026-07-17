import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AccountNotFoundError } from '../accounts/domain/errors/account-not-found.error';
import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import type { DecodedToken } from '../auth/domain/services/token-service';
import { AddTransactionUseCase } from './application/use-cases/add-transaction.use-case';
import { DeleteTransactionUseCase } from './application/use-cases/delete-transaction.use-case';
import { EditTransactionUseCase } from './application/use-cases/edit-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { TransactionNotFoundError } from './domain/errors/transaction-not-found.error';
import {
  addTransactionSchema,
  type AddTransactionDto,
} from './dto/add-transaction.dto';
import {
  editTransactionSchema,
  type EditTransactionDto,
} from './dto/edit-transaction.dto';
import {
  listTransactionsSchema,
  type ListTransactionsDto,
} from './dto/list-transactions.dto';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly listTransactions: ListTransactionsUseCase,
    private readonly addTransaction: AddTransactionUseCase,
    private readonly editTransaction: EditTransactionUseCase,
    private readonly deleteTransaction: DeleteTransactionUseCase,
  ) {}

  @Get()
  async list(
    @CurrentUser() user: DecodedToken,
    @Query(new ZodValidationPipe(listTransactionsSchema))
    query: ListTransactionsDto,
  ) {
    return this.listTransactions.execute({
      userId: user.sub,
      ...query,
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(addTransactionSchema)) dto: AddTransactionDto,
  ) {
    try {
      return await this.addTransaction.execute({ userId: user.sub, ...dto });
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Patch(':id')
  async edit(
    @CurrentUser() user: DecodedToken,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(editTransactionSchema)) dto: EditTransactionDto,
  ) {
    try {
      return await this.editTransaction.execute({
        id,
        userId: user.sub,
        ...dto,
      });
    } catch (e) {
      if (
        e instanceof TransactionNotFoundError ||
        e instanceof AccountNotFoundError
      ) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      await this.deleteTransaction.execute({ id, userId: user.sub });
    } catch (e) {
      if (e instanceof TransactionNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
