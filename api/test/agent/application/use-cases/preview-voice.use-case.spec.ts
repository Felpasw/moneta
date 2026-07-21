import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { PreviewVoiceUseCase } from '~/agent/application/use-cases/preview-voice.use-case';
import { VOICE_PREVIEW_PHRASE_PT_BR } from '~/agent/domain/constants/voice-preview';
import type {
  SynthesizeStreamParams,
  TtsService,
  TtsVoice,
} from '~/agent/domain/ports/tts-service';

interface SynthCall {
  readonly voiceId: string;
  readonly text: string;
}

const buildTts = (
  chunks: Buffer[] | Error,
): {
  tts: TtsService;
  calls: SynthCall[];
} => {
  const calls: SynthCall[] = [];
  const tts: TtsService = {
    // eslint-disable-next-line @typescript-eslint/require-await
    async *synthesizeStream(params: SynthesizeStreamParams) {
      calls.push({ voiceId: params.voiceId, text: params.text });
      if (chunks instanceof Error) throw chunks;
      for (const chunk of chunks) yield chunk;
    },
    listVoices: (): Promise<TtsVoice[]> => Promise.resolve([]),
  };
  return { tts, calls };
};

describe('PreviewVoiceUseCase', () => {
  const initial = new Date('2026-07-16T10:00:00Z');

  it('synthesizes with the standard preview phrase and returns concatenated audio', async () => {
    const clock = new FixedClock(initial);
    const { tts, calls } = buildTts([
      Buffer.from([0x01, 0x02]),
      Buffer.from([0x03, 0x04]),
    ]);
    const useCase = new PreviewVoiceUseCase(tts, clock);

    const audio = await useCase.execute('v-1');

    expect(audio.equals(Buffer.from([0x01, 0x02, 0x03, 0x04]))).toBe(true);
    expect(calls).toEqual([
      { voiceId: 'v-1', text: VOICE_PREVIEW_PHRASE_PT_BR },
    ]);
  });

  it('serves subsequent calls with the same voiceId from cache within the TTL window', async () => {
    const clock = new FixedClock(initial);
    const { tts, calls } = buildTts([Buffer.from([0xaa])]);
    const useCase = new PreviewVoiceUseCase(tts, clock, {
      cacheTtlMs: 24 * 60 * 60 * 1000,
    });

    await useCase.execute('v-1');
    clock.advance(12 * 60 * 60 * 1000);
    await useCase.execute('v-1');
    clock.advance(11 * 60 * 60 * 1000);
    await useCase.execute('v-1');

    expect(calls).toHaveLength(1);
  });

  it('caches independently per voiceId', async () => {
    const clock = new FixedClock(initial);
    const { tts, calls } = buildTts([Buffer.from([0x00])]);
    const useCase = new PreviewVoiceUseCase(tts, clock);

    await useCase.execute('v-1');
    await useCase.execute('v-2');
    await useCase.execute('v-1');
    await useCase.execute('v-2');

    expect(calls.map((c) => c.voiceId)).toEqual(['v-1', 'v-2']);
  });

  it('re-synthesizes after the TTL expires', async () => {
    const clock = new FixedClock(initial);
    const { tts, calls } = buildTts([Buffer.from([0x00])]);
    const useCase = new PreviewVoiceUseCase(tts, clock, {
      cacheTtlMs: 1_000,
    });

    await useCase.execute('v-1');
    clock.advance(1_001);
    await useCase.execute('v-1');

    expect(calls).toHaveLength(2);
  });

  it('does not cache failures — a failed call is retried on the next execute', async () => {
    const clock = new FixedClock(initial);
    let attempt = 0;
    const tts: TtsService = {
      // eslint-disable-next-line @typescript-eslint/require-await
      async *synthesizeStream() {
        attempt += 1;
        if (attempt === 1) throw new Error('boom');
        yield Buffer.from([0x99]);
      },
      listVoices: (): Promise<TtsVoice[]> => Promise.resolve([]),
    };
    const useCase = new PreviewVoiceUseCase(tts, clock);

    await expect(useCase.execute('v-1')).rejects.toThrow(/boom/);
    const audio = await useCase.execute('v-1');

    expect(audio.equals(Buffer.from([0x99]))).toBe(true);
    expect(attempt).toBe(2);
  });

  it('uses a 24 hour default TTL when no options are provided', async () => {
    const clock = new FixedClock(initial);
    const { tts, calls } = buildTts([Buffer.from([0x00])]);
    const useCase = new PreviewVoiceUseCase(tts, clock);

    await useCase.execute('v-1');
    clock.advance(24 * 60 * 60 * 1000 - 1);
    await useCase.execute('v-1');
    clock.advance(2);
    await useCase.execute('v-1');

    expect(calls).toHaveLength(2);
  });
});
