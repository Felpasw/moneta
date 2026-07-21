import type { TtsService } from '~/agent/domain/ports/tts-service';

import type {
  SpeakParams,
  TtsPipelineListeners,
} from '~/agent/domain/types/tts-pipeline';

export class TtsPipeline {
  private current: AbortController | null = null;

  constructor(
    private readonly tts: TtsService,
    private readonly listeners: TtsPipelineListeners,
  ) {}

  async speak(params: SpeakParams): Promise<void> {
    this.abortCurrent();
    const controller = new AbortController();
    this.current = controller;
    try {
      for await (const chunk of this.tts.synthesizeStream({
        text: params.text,
        voiceId: params.voiceId,
        signal: controller.signal,
      })) {
        if (controller.signal.aborted) return;
        this.listeners.onAudio(chunk);
      }
      if (!controller.signal.aborted && this.current === controller) {
        this.listeners.onDone();
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      this.listeners.onError(
        err instanceof Error ? err : new Error(String(err)),
      );
    } finally {
      if (this.current === controller) this.current = null;
    }
  }

  cancel(): void {
    this.abortCurrent();
  }

  private abortCurrent(): void {
    if (this.current === null) return;
    const prev = this.current;
    this.current = null;
    prev.abort();
    this.listeners.onCanceled();
  }
}
