import { Module } from '@nestjs/common';

import { AuthModule } from '../../auth/auth.module';
import { AccountsController } from './accounts.controller';
import { AddBankAccountUseCase } from './application/use-cases/add-bank-account.use-case';
import { DeleteBankAccountUseCase } from './application/use-cases/delete-bank-account.use-case';
import { GetAccountByIdUseCase } from './application/use-cases/get-account-by-id.use-case';
import { ListMyAccountsUseCase } from './application/use-cases/list-my-accounts.use-case';
import { SetBalanceUseCase } from './application/use-cases/set-balance.use-case';
import { UpdateBankAccountUseCase } from './application/use-cases/update-bank-account.use-case';
import { USER_BANK_ACCOUNTS_REPOSITORY } from './domain/ports/user-bank-accounts-repository';
import { PrismaUserBankAccountsRepository } from './infrastructure/repositories/prisma-user-bank-accounts.repository';

@Module({
  imports: [AuthModule],
  controllers: [AccountsController],
  providers: [
    {
      provide: USER_BANK_ACCOUNTS_REPOSITORY,
      useClass: PrismaUserBankAccountsRepository,
    },
    ListMyAccountsUseCase,
    GetAccountByIdUseCase,
    AddBankAccountUseCase,
    UpdateBankAccountUseCase,
    DeleteBankAccountUseCase,
    SetBalanceUseCase,
  ],
  exports: [
    ListMyAccountsUseCase,
    GetAccountByIdUseCase,
    AddBankAccountUseCase,
    UpdateBankAccountUseCase,
    DeleteBankAccountUseCase,
    SetBalanceUseCase,
  ],
})
export class AccountsModule {}
