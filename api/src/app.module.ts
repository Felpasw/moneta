import { Module } from '@nestjs/common';

import { ClockModule } from './@common/infrastructure/clock/clock.module';
import { EphemeralStoreModule } from './@common/infrastructure/ephemeral-store/ephemeral-store.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssistantModule } from './assistant/assistant.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './infrastructure/prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ClockModule,
    PrismaModule,
    EphemeralStoreModule,
    UsersModule,
    AuthModule,
    AssistantModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
