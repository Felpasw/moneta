import { Module } from '@nestjs/common';

import { LlmService } from './llm.service';
import { OpenAiLlmHealthIndicator } from './providers/openai/openai-llm-health.indicator';

@Module({
  providers: [LlmService, OpenAiLlmHealthIndicator],
  exports: [LlmService, OpenAiLlmHealthIndicator],
})
export class LlmModule {}
