import type { AudioChunk } from '~/agent/domain/ports/tts-service';

export interface TtsPipelineListeners {
  readonly onAudio: (chunk: AudioChunk) => void;
  readonly onDone: () => void;
  readonly onCanceled: () => void;
  readonly onError: (err: Error) => void;
}

export interface SpeakParams {
  readonly text: string;
  readonly voiceId: string;
}
