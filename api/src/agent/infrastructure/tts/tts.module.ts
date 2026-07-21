import { Module } from '@nestjs/common';

import { HttpStreamingTtsService } from './http-streaming-tts.service';
import { ElevenLabsTtsHealthIndicator } from './providers/elevenlabs/elevenlabs-tts-health.indicator';
import { ElevenLabsTtsProvider } from './providers/elevenlabs/elevenlabs-tts.provider';
import { TTS_SERVICE, TTS_PROVIDER } from './tts.tokens';

@Module({
  providers: [
    ElevenLabsTtsHealthIndicator,
    { provide: TTS_PROVIDER, useClass: ElevenLabsTtsProvider },
    { provide: TTS_SERVICE, useClass: HttpStreamingTtsService },
  ],
  exports: [ElevenLabsTtsHealthIndicator, TTS_SERVICE],
})
export class TtsModule {}
