import { Module } from '@nestjs/common';

import { ElevenLabsTtsHealthIndicator } from './providers/elevenlabs/elevenlabs-tts-health.indicator';
import { TtsService } from './tts.service';

@Module({
  providers: [TtsService, ElevenLabsTtsHealthIndicator],
  exports: [TtsService, ElevenLabsTtsHealthIndicator],
})
export class TtsModule {}
