import type { SynthesizeStreamParams, TtsVoice } from './tts-service';

export interface TtsHttpRequest {
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body?: unknown;
}

export interface TtsProvider {
  buildStreamRequest(params: SynthesizeStreamParams): TtsHttpRequest;
  buildListVoicesRequest(): TtsHttpRequest;
  parseVoicesResponse(raw: unknown): TtsVoice[];
}
