import {
  BadRequestException,
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
  UseGuards,
} from '@nestjs/common';

import { ZodValidationPipe } from '../@common/infrastructure/pipes/zod-validation.pipe';
import { CurrentUser } from '../auth/infrastructure/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/infrastructure/guards/jwt-auth.guard';
import type { DecodedToken } from '../auth/domain/services/token-service';
import { AddBankAccountUseCase } from './application/use-cases/add-bank-account.use-case';
import { DeleteBankAccountUseCase } from './application/use-cases/delete-bank-account.use-case';
import { ListMyAccountsUseCase } from './application/use-cases/list-my-accounts.use-case';
import { SetBalanceUseCase } from './application/use-cases/set-balance.use-case';
import { UpdateBankAccountUseCase } from './application/use-cases/update-bank-account.use-case';
import { AccountNotFoundError } from './domain/errors/account-not-found.error';
import { InvalidCreditCardConfigError } from './domain/errors/invalid-credit-card-config.error';
import {
  addBankAccountSchema,
  type AddBankAccountDto,
} from './dto/add-bank-account.dto';
import { setBalanceSchema, type SetBalanceDto } from './dto/set-balance.dto';
import {
  updateBankAccountSchema,
  type UpdateBankAccountDto,
} from './dto/update-bank-account.dto';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(
    private readonly listMyAccounts: ListMyAccountsUseCase,
    private readonly addBankAccount: AddBankAccountUseCase,
    private readonly updateBankAccount: UpdateBankAccountUseCase,
    private readonly deleteBankAccount: DeleteBankAccountUseCase,
    private readonly setBalance: SetBalanceUseCase,
  ) {}

  @Get()
  async list(@CurrentUser() user: DecodedToken) {
    return this.listMyAccounts.execute({ userId: user.sub });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async add(
    @CurrentUser() user: DecodedToken,
    @Body(new ZodValidationPipe(addBankAccountSchema)) dto: AddBankAccountDto,
  ) {
    try {
      return await this.addBankAccount.execute({ userId: user.sub, ...dto });
    } catch (e) {
      if (e instanceof InvalidCreditCardConfigError) {
        throw new BadRequestException(e.message);
      }
      throw e;
    }
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: DecodedToken,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBankAccountSchema))
    dto: UpdateBankAccountDto,
  ) {
    try {
      return await this.updateBankAccount.execute({
        id,
        userId: user.sub,
        ...dto,
      });
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentUser() user: DecodedToken, @Param('id') id: string) {
    try {
      await this.deleteBankAccount.execute({ id, userId: user.sub });
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }

  @Post(':id/balance')
  async setAccountBalance(
    @CurrentUser() user: DecodedToken,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(setBalanceSchema)) dto: SetBalanceDto,
  ) {
    try {
      return await this.setBalance.execute({
        id,
        userId: user.sub,
        amount: dto.amount,
      });
    } catch (e) {
      if (e instanceof AccountNotFoundError) {
        throw new NotFoundException(e.message);
      }
      throw e;
    }
  }
}
