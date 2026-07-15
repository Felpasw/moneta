import { Module } from '@nestjs/common';

import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { LlmModule } from './infrastructure/llm/llm.module';
import { TtsModule } from './infrastructure/tts/tts.module';

@Module({
  imports: [LlmModule, TtsModule],
  controllers: [AgentController],
  providers: [AgentService],
  exports: [LlmModule, TtsModule],
})
export class AgentModule {}
