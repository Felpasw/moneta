export type AudioChunk = Buffer;

export interface SynthesizeStreamParams {
  readonly text: string;
  readonly voiceId: string;
  readonly signal?: AbortSignal;
}

export interface TtsVoice {
  readonly voiceId: string;
  readonly name: string;
  readonly language?: string;
}

export interface TtsService {
  synthesizeStream(params: SynthesizeStreamParams): AsyncIterable<AudioChunk>;
  listVoices(): Promise<TtsVoice[]>;
}
