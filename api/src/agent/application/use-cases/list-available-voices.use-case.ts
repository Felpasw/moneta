import { Inject, Injectable } from '@nestjs/common';

import type { Clock } from '~/@common/domain/ports/clock';
import { CLOCK } from '~/@common/domain/ports/clock';
import type { TtsService, TtsVoice } from '~/agent/domain/ports/tts-service';
import { TTS_SERVICE } from '~/agent/infrastructure/tts/tts.tokens';

import type { ListAvailableVoicesUseCaseOptions } from '~/agent/domain/types/list-available-voices';

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  readonly voices: TtsVoice[];
  readonly expiresAt: number;
}

@Injectable()
export class ListAvailableVoicesUseCase {
  private cache: CacheEntry | null = null;
  private readonly cacheTtlMs: number;

  constructor(
    @Inject(TTS_SERVICE) private readonly tts: TtsService,
    @Inject(CLOCK) private readonly clock: Clock,
    options: ListAvailableVoicesUseCaseOptions = {},
  ) {
    this.cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  async execute(): Promise<TtsVoice[]> {
    const nowMs = this.clock.now().getTime();
    if (this.cache !== null && nowMs < this.cache.expiresAt) {
      return this.cache.voices;
    }
    const voices = await this.tts.listVoices();
    this.cache = { voices, expiresAt: nowMs + this.cacheTtlMs };
    return voices;
  }
}
