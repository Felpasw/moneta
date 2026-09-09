import type { TtsVoice } from '~/agent/domain/ports/tts-service';

import { mapElevenLabsLanguage } from './map-elevenlabs-language';

interface RawElevenLabsVoice {
  readonly voice_id: string;
  readonly name: string;
  readonly labels?: { readonly language?: string };
}

export const normalizeVoice = (raw: RawElevenLabsVoice): TtsVoice => ({
  voiceId: raw.voice_id,
  name: raw.name,
  language: mapElevenLabsLanguage(raw.labels?.language),
});
