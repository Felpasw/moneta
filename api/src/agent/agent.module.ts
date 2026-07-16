import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { ListAvailableVoicesUseCase } from './application/use-cases/list-available-voices.use-case';
import { AgentRealtimeGateway } from './infrastructure/gateways/agent-realtime.gateway';
import { LlmModule } from './infrastructure/llm/llm.module';
import { TtsModule } from './infrastructure/tts/tts.module';

@Module({
  imports: [AuthModule, LlmModule, TtsModule],
  controllers: [AgentController],
  providers: [AgentService, AgentRealtimeGateway, ListAvailableVoicesUseCase],
  exports: [LlmModule, TtsModule],
})
export class AgentModule {}
