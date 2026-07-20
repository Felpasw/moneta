import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ClockModule } from './@common/infrastructure/clock/clock.module';
import { EphemeralStoreModule } from './@common/infrastructure/ephemeral-store/ephemeral-store.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { AccountsToolsModule } from './accounts/tools/accounts-tools.module';
import { AgentModule } from './agent/agent.module';
import { AuthModule } from './auth/auth.module';
import { BanksModule } from './banks/banks.module';
import { BanksToolsModule } from './banks/tools/banks-tools.module';
import { CategoriesModule } from './categories/categories.module';
import { CategoriesToolsModule } from './categories/tools/categories-tools.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { ToolsModule } from './tools/tools.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransactionsToolsModule } from './transactions/tools/transactions-tools.module';
import { TransfersModule } from './transfers/transfers.module';
import { TransfersToolsModule } from './transfers/tools/transfers-tools.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ClockModule,
    PrismaModule,
    EphemeralStoreModule,
    UsersModule,
    AuthModule,
    ToolsModule,
    AgentModule,
    BanksModule,
    BanksToolsModule,
    AccountsModule,
    AccountsToolsModule,
    CategoriesModule,
    CategoriesToolsModule,
    TransactionsModule,
    TransactionsToolsModule,
    TransfersModule,
    TransfersToolsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
