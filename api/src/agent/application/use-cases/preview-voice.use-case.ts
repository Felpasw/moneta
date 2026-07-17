import { Inject, Injectable } from '@nestjs/common';

import type { Clock } from '~/@common/domain/ports/clock';
import { CLOCK } from '~/@common/domain/ports/clock';
import {
  VOICE_PREVIEW_CACHE_TTL_MS,
  VOICE_PREVIEW_PHRASE_PT_BR,
} from '~/agent/domain/constants/voice-preview';
import type { TtsService } from '~/agent/domain/ports/tts-service';
import type { PreviewVoiceUseCaseOptions } from '~/agent/domain/types/preview-voice';
import { TTS_SERVICE } from '~/agent/infrastructure/tts/tts.tokens';

import type { VoicePreviewCacheEntry } from '../types/voice-preview-cache-entry';

@Injectable()
export class PreviewVoiceUseCase {
  private readonly cache = new Map<string, VoicePreviewCacheEntry>();
  private readonly cacheTtlMs: number;
  private readonly phrase: string;

  constructor(
    @Inject(TTS_SERVICE) private readonly tts: TtsService,
    @Inject(CLOCK) private readonly clock: Clock,
    options: PreviewVoiceUseCaseOptions = {},
  ) {
    this.cacheTtlMs = options.cacheTtlMs ?? VOICE_PREVIEW_CACHE_TTL_MS;
    this.phrase = options.phrase ?? VOICE_PREVIEW_PHRASE_PT_BR;
  }

  async execute(voiceId: string): Promise<Buffer> {
    const nowMs = this.clock.now().getTime();
    const cached = this.cache.get(voiceId);
    if (cached && nowMs < cached.expiresAt) return cached.audio;
    const audio = await this.synthesize(voiceId);
    this.cache.set(voiceId, { audio, expiresAt: nowMs + this.cacheTtlMs });
    return audio;
  }

  private async synthesize(voiceId: string): Promise<Buffer> {
    const chunks: Buffer[] = [];
    for await (const chunk of this.tts.synthesizeStream({
      text: this.phrase,
      voiceId,
    })) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }
}
