import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { ClockModule } from './@common/infrastructure/clock/clock.module';
import { EphemeralStoreModule } from './@common/infrastructure/ephemeral-store/ephemeral-store.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AccountsModule } from './accounts/accounts.module';
import { AgentModule } from './agent/agent.module';
import { ToolsModule } from './agent/tools/tools.module';
import { AuthModule } from './auth/auth.module';
import { BanksModule } from './banks/banks.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
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
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TransfersModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
