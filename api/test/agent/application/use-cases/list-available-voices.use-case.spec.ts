import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { ListAvailableVoicesUseCase } from '~/agent/application/use-cases/list-available-voices.use-case';
import type { TtsClient, TtsVoice } from '~/agent/domain/ports/tts-client';

const buildTts = (
  list: TtsVoice[] | Error,
): {
  listSpy: jest.Mock;
  tts: TtsClient;
} => {
  const listSpy = jest.fn(() => {
    if (list instanceof Error) return Promise.reject(list);
    return Promise.resolve(list);
  });
  const tts: TtsClient = {
    // eslint-disable-next-line require-yield, @typescript-eslint/require-await
    synthesizeStream: async function* () {
      throw new Error('unused');
    },
    listVoices: listSpy,
  };
  return { listSpy, tts };
};

describe('ListAvailableVoicesUseCase', () => {
  const initial = new Date('2026-07-16T10:00:00Z');
  const voices: TtsVoice[] = [
    { voiceId: 'v1', name: 'Rachel', language: 'en' },
    { voiceId: 'v2', name: 'Carlos', language: 'pt' },
  ];

  it('fetches voices on the first call', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const useCase = new ListAvailableVoicesUseCase(tts, clock);

    const result = await useCase.execute();

    expect(result).toEqual(voices);
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it('serves subsequent calls from cache within the TTL window without hitting the adapter', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, {
      cacheTtlMs: 5 * 60 * 1000,
    });

    await useCase.execute();
    clock.advance(4 * 60 * 1000);
    await useCase.execute();
    clock.advance(59 * 1000);
    const last = await useCase.execute();

    expect(last).toEqual(voices);
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it('refetches after the TTL expires', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, {
      cacheTtlMs: 5 * 60 * 1000,
    });

    await useCase.execute();
    clock.advance(5 * 60 * 1000 + 1);
    await useCase.execute();

    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures — a failed call is retried on the next execute', async () => {
    const clock = new FixedClock(initial);
    const listSpy = jest
      .fn<Promise<TtsVoice[]>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(voices);
    const tts: TtsClient = {
      // eslint-disable-next-line require-yield, @typescript-eslint/require-await
      synthesizeStream: async function* () {
        throw new Error('unused');
      },
      listVoices: listSpy,
    };
    const useCase = new ListAvailableVoicesUseCase(tts, clock);

    await expect(useCase.execute()).rejects.toThrow(/boom/);
    const second = await useCase.execute();

    expect(second).toEqual(voices);
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('uses a 5 minute default TTL when no options are provided', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const useCase = new ListAvailableVoicesUseCase(tts, clock);

    await useCase.execute();
    clock.advance(5 * 60 * 1000 - 1);
    await useCase.execute();
    clock.advance(2);
    await useCase.execute();

    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
