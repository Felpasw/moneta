import { FixedClock } from '~/@common/infrastructure/clock/fixed-clock';
import { ListAvailableVoicesUseCase } from '~/agent/application/use-cases/list-available-voices.use-case';
import { OutputLanguage } from '~/agent/domain/constants/output-language';
import type { TtsService, TtsVoice } from '~/agent/domain/ports/tts-service';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '~/agent/personality/domain/types/assistant-profile';

const buildTts = (
  list: TtsVoice[] | Error,
): {
  listSpy: jest.Mock;
  tts: TtsService;
} => {
  const listSpy = jest.fn(() => {
    if (list instanceof Error) return Promise.reject(list);
    return Promise.resolve(list);
  });
  const tts: TtsService = {
    // eslint-disable-next-line require-yield, @typescript-eslint/require-await
    synthesizeStream: async function* () {
      throw new Error('unused');
    },
    listVoices: listSpy,
  };
  return { listSpy, tts };
};

const buildProfileRepo = (
  outputLanguage: OutputLanguage | null,
): {
  findByUserIdSpy: jest.Mock;
  repo: AssistantProfileRepository;
} => {
  const profile: AssistantProfile | null =
    outputLanguage === null
      ? null
      : {
          id: 'profile-1',
          userId: 'user-1',
          treatmentStyle: TreatmentStyle.Informal,
          outputLanguage,
          voiceId: 'v1',
          avatarUrl: null,
          createdAt: new Date('2026-01-01T00:00:00Z'),
          updatedAt: new Date('2026-01-01T00:00:00Z'),
        };
  const findByUserIdSpy = jest.fn(() => Promise.resolve(profile));
  const repo: AssistantProfileRepository = {
    findByUserId: findByUserIdSpy,
    create: jest.fn(),
    update: jest.fn(),
  };
  return { findByUserIdSpy, repo };
};

describe('ListAvailableVoicesUseCase', () => {
  const initial = new Date('2026-07-16T10:00:00Z');
  const voices: TtsVoice[] = [
    { voiceId: 'v1', name: 'Rachel', language: 'en_US' },
    { voiceId: 'v2', name: 'Carlos', language: 'pt_BR' },
    { voiceId: 'v3', name: 'NoLabels', language: 'unknown' },
  ];

  it('marks languageMatch per voice against the caller profile outputLanguage (pt_BR)', async () => {
    const clock = new FixedClock(initial);
    const { tts } = buildTts(voices);
    const { repo } = buildProfileRepo(OutputLanguage.PtBr);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result).toEqual([
      {
        voiceId: 'v1',
        name: 'Rachel',
        language: 'en_US',
        languageMatch: 'mismatch',
      },
      {
        voiceId: 'v2',
        name: 'Carlos',
        language: 'pt_BR',
        languageMatch: 'match',
      },
      {
        voiceId: 'v3',
        name: 'NoLabels',
        language: 'unknown',
        languageMatch: 'unknown',
      },
    ]);
  });

  it('marks languageMatch per voice against the caller profile outputLanguage (en_US)', async () => {
    const clock = new FixedClock(initial);
    const { tts } = buildTts(voices);
    const { repo } = buildProfileRepo(OutputLanguage.EnUs);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.map((v) => v.languageMatch)).toEqual([
      'match',
      'mismatch',
      'unknown',
    ]);
  });

  it('falls back to default outputLanguage when profile is missing', async () => {
    const clock = new FixedClock(initial);
    const { tts } = buildTts(voices);
    const { repo } = buildProfileRepo(null);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    const result = await useCase.execute({ userId: 'user-1' });

    expect(result.map((v) => v.languageMatch)).toEqual([
      'mismatch',
      'match',
      'unknown',
    ]);
  });

  it('serves subsequent calls with the same outputLanguage from cache within the TTL window', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const { repo } = buildProfileRepo(OutputLanguage.PtBr);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    await useCase.execute({ userId: 'user-1' });
    clock.advance(4 * 60 * 1000);
    await useCase.execute({ userId: 'user-1' });
    clock.advance(59 * 1000);
    const last = await useCase.execute({ userId: 'user-1' });

    expect(last.every((v) => v.languageMatch !== undefined)).toBe(true);
    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it('keeps separate cache buckets per outputLanguage', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const ptRepo = buildProfileRepo(OutputLanguage.PtBr).repo;
    const enRepo = buildProfileRepo(OutputLanguage.EnUs).repo;

    const usePt = new ListAvailableVoicesUseCase(tts, clock, ptRepo);
    const useEn = new ListAvailableVoicesUseCase(tts, clock, enRepo);

    await usePt.execute({ userId: 'pt-user' });
    await useEn.execute({ userId: 'en-user' });

    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('refetches after the TTL expires', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const { repo } = buildProfileRepo(OutputLanguage.PtBr);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    await useCase.execute({ userId: 'user-1' });
    clock.advance(5 * 60 * 1000 + 1);
    await useCase.execute({ userId: 'user-1' });

    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('does not cache failures — a failed call is retried on the next execute', async () => {
    const clock = new FixedClock(initial);
    const listSpy = jest
      .fn<Promise<TtsVoice[]>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(voices);
    const tts: TtsService = {
      // eslint-disable-next-line require-yield, @typescript-eslint/require-await
      synthesizeStream: async function* () {
        throw new Error('unused');
      },
      listVoices: listSpy,
    };
    const { repo } = buildProfileRepo(OutputLanguage.PtBr);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    await expect(useCase.execute({ userId: 'user-1' })).rejects.toThrow(/boom/);
    const second = await useCase.execute({ userId: 'user-1' });

    expect(second.map((v) => v.voiceId)).toEqual(['v1', 'v2', 'v3']);
    expect(listSpy).toHaveBeenCalledTimes(2);
  });

  it('uses a 5 minute default TTL when no options are provided', async () => {
    const clock = new FixedClock(initial);
    const { listSpy, tts } = buildTts(voices);
    const { repo } = buildProfileRepo(OutputLanguage.PtBr);
    const useCase = new ListAvailableVoicesUseCase(tts, clock, repo);

    await useCase.execute({ userId: 'user-1' });
    clock.advance(5 * 60 * 1000 - 1);
    await useCase.execute({ userId: 'user-1' });
    clock.advance(2);
    await useCase.execute({ userId: 'user-1' });

    expect(listSpy).toHaveBeenCalledTimes(2);
  });
});
