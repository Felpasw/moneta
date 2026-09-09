import { Inject, Injectable } from '@nestjs/common';

import type { Clock } from '~/@common/domain/ports/clock';
import { CLOCK } from '~/@common/domain/ports/clock';
import { LIST_VOICES_CACHE_TTL_MS } from '~/agent/domain/constants/list-voices-cache';
import {
  DEFAULT_OUTPUT_LANGUAGE,
  OutputLanguage,
} from '~/agent/domain/constants/output-language';
import type { TtsService } from '~/agent/domain/ports/tts-service';
import type { TtsVoiceWithMatch } from '~/agent/domain/types/tts-voice-with-match';
import { resolveLanguageMatch } from '~/agent/domain/utils/resolve-language-match';
import {
  ASSISTANT_PROFILE_REPOSITORY,
  type AssistantProfileRepository,
} from '~/agent/personality/domain/ports/assistant-profile-repository';
import { TTS_SERVICE } from '~/agent/infrastructure/tts/tts.tokens';

export interface ListAvailableVoicesInput {
  readonly userId: string;
}

interface CacheEntry {
  readonly voices: TtsVoiceWithMatch[];
  readonly expiresAt: number;
}

@Injectable()
export class ListAvailableVoicesUseCase {
  private readonly cache = new Map<OutputLanguage, CacheEntry>();
  private readonly cacheTtlMs = LIST_VOICES_CACHE_TTL_MS;

  constructor(
    @Inject(TTS_SERVICE) private readonly tts: TtsService,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ASSISTANT_PROFILE_REPOSITORY)
    private readonly profileRepo: AssistantProfileRepository,
  ) {}

  async execute(input: ListAvailableVoicesInput): Promise<TtsVoiceWithMatch[]> {
    const outputLanguage = await this.resolveOutputLanguage(input.userId);
    const nowMs = this.clock.now().getTime();
    const cached = this.cache.get(outputLanguage);
    if (cached !== undefined && nowMs < cached.expiresAt) {
      return cached.voices;
    }
    const voices = await this.tts.listVoices();
    const withMatch: TtsVoiceWithMatch[] = voices.map((v) => ({
      ...v,
      languageMatch: resolveLanguageMatch(v.language, outputLanguage),
    }));
    this.cache.set(outputLanguage, {
      voices: withMatch,
      expiresAt: nowMs + this.cacheTtlMs,
    });
    return withMatch;
  }

  private async resolveOutputLanguage(userId: string): Promise<OutputLanguage> {
    const profile = await this.profileRepo.findByUserId(userId);
    if (profile === null) return DEFAULT_OUTPUT_LANGUAGE;
    return profile.outputLanguage;
  }
}
