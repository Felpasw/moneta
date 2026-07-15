import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ClockModule } from './@common/infrastructure/clock/clock.module';
import { EphemeralStoreModule } from './@common/infrastructure/ephemeral-store/ephemeral-store.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ClockModule,
    PrismaModule,
    EphemeralStoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
