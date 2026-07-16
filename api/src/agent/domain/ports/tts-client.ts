export type AudioChunk = Buffer;

export interface SynthesizeStreamParams {
  readonly text: string;
  readonly voiceId: string;
}

export interface TtsClient {
  synthesizeStream(params: SynthesizeStreamParams): AsyncIterable<AudioChunk>;
}
