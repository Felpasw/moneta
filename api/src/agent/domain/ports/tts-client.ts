export type AudioChunk = Buffer;

export interface SynthesizeStreamParams {
  readonly text: string;
  readonly voiceId: string;
}

export interface TtsVoice {
  readonly voiceId: string;
  readonly name: string;
  readonly language?: string;
}

export interface TtsClient {
  synthesizeStream(params: SynthesizeStreamParams): AsyncIterable<AudioChunk>;
  listVoices(): Promise<TtsVoice[]>;
}
