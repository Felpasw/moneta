import type { TtsVoice } from '~/agent/domain/ports/tts-client';

interface RawElevenLabsVoice {
  readonly voice_id: string;
  readonly name: string;
  readonly labels?: { readonly language?: string };
}

export const normalizeVoice = (raw: RawElevenLabsVoice): TtsVoice => {
  const language = raw.labels?.language;
  if (language !== undefined) {
    return { voiceId: raw.voice_id, name: raw.name, language };
  }
  return { voiceId: raw.voice_id, name: raw.name };
};
