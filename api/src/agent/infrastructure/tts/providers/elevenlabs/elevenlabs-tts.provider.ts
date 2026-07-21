import { Injectable } from '@nestjs/common';

import type {
  SynthesizeStreamParams,
  TtsVoice,
} from '~/agent/domain/ports/tts-service';
import type {
  TtsHttpRequest,
  TtsProvider,
} from '~/agent/domain/ports/tts-provider';
import { env } from '~/config/env';

import { ELEVENLABS_TTS } from './constants/elevenlabs-tts';
import { buildStreamUrl } from './utils/build-stream-url';
import { buildVoicesUrl } from './utils/build-voices-url';
import { normalizeVoice } from './utils/normalize-voice';

interface RawElevenLabsVoicesResponse {
  readonly voices?: readonly Parameters<typeof normalizeVoice>[0][];
}

@Injectable()
export class ElevenLabsTtsProvider implements TtsProvider {
  buildStreamRequest(params: SynthesizeStreamParams): TtsHttpRequest {
    return {
      url: buildStreamUrl(params.voiceId),
      headers: {
        'xi-api-key': env.TTS_API_KEY,
        accept: 'audio/mpeg',
      },
      body: {
        text: params.text,
        model_id: ELEVENLABS_TTS.modelId,
      },
    };
  }

  buildListVoicesRequest(): TtsHttpRequest {
    return {
      url: buildVoicesUrl(),
      headers: { 'xi-api-key': env.TTS_API_KEY },
    };
  }

  parseVoicesResponse(raw: unknown): TtsVoice[] {
    const envelope = raw as RawElevenLabsVoicesResponse;
    if (!envelope.voices) return [];
    return envelope.voices.map(normalizeVoice);
  }
}
