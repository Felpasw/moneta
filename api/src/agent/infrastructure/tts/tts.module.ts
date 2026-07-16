import { Module } from '@nestjs/common';

import { ElevenLabsTtsClient } from './providers/elevenlabs/elevenlabs-tts.client';
import { ElevenLabsTtsHealthIndicator } from './providers/elevenlabs/elevenlabs-tts-health.indicator';
import { TTS_CLIENT } from './tts.tokens';
import { TtsService } from './tts.service';

@Module({
  providers: [
    TtsService,
    ElevenLabsTtsHealthIndicator,
    { provide: TTS_CLIENT, useClass: ElevenLabsTtsClient },
  ],
  exports: [TtsService, ElevenLabsTtsHealthIndicator, TTS_CLIENT],
})
export class TtsModule {}
