export type AudioChunk = Buffer;

export interface SynthesizeStreamParams {
  readonly text: string;
  readonly voiceId: string;
  readonly signal?: AbortSignal;
}

import type { NormalizedVoiceLanguage } from '~/agent/domain/constants/normalized-voice-language';

export interface TtsVoice {
  readonly voiceId: string;
  readonly name: string;
  readonly language: NormalizedVoiceLanguage;
}

export interface TtsService {
  synthesizeStream(params: SynthesizeStreamParams): AsyncIterable<AudioChunk>;
  listVoices(): Promise<TtsVoice[]>;
}
