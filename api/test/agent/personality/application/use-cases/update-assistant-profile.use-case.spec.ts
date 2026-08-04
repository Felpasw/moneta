import { UpdateAssistantProfileUseCase } from '~/agent/personality/application/use-cases/update-assistant-profile.use-case';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import { InvalidAvatarUrlError } from '~/agent/personality/domain/errors/invalid-avatar-url.error';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '~/agent/personality/domain/types/assistant-profile';

const PROFILE: AssistantProfile = {
  id: 'p-1',
  userId: 'u-1',
  treatmentStyle: TreatmentStyle.Informal,
  voiceId: 'v-old',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const buildRepo = (): {
  repo: AssistantProfileRepository;
  update: jest.Mock;
} => {
  const update = jest
    .fn()
    .mockImplementation((_userId: string, patch: Record<string, unknown>) =>
      Promise.resolve({ ...PROFILE, ...patch }),
    );
  return {
    repo: {
      findByUserId: jest.fn(),
      create: jest.fn(),
      update,
    },
    update,
  };
};

describe('UpdateAssistantProfileUseCase', () => {
  it('delegates the patch to the repository', async () => {
    const { repo, update } = buildRepo();
    const useCase = new UpdateAssistantProfileUseCase(repo);

    const result = await useCase.execute('u-1', {
      treatmentStyle: TreatmentStyle.Formal,
      voiceId: 'v-new',
    });

    expect(update).toHaveBeenCalledWith('u-1', {
      treatmentStyle: TreatmentStyle.Formal,
      voiceId: 'v-new',
    });
    expect(result.treatmentStyle).toBe(TreatmentStyle.Formal);
    expect(result.voiceId).toBe('v-new');
  });

  it('accepts a null avatarUrl (unset avatar)', async () => {
    const { repo, update } = buildRepo();
    const useCase = new UpdateAssistantProfileUseCase(repo);

    await useCase.execute('u-1', { avatarUrl: null });

    expect(update).toHaveBeenCalledWith('u-1', { avatarUrl: null });
  });

  it.each([
    'dicebear:notionists:felps',
    'dicebear:avataaars:Felipe',
    'dicebear:open-peeps:user_123',
    'dicebear:pixel-art:seed-with-hyphens',
  ])('accepts a valid DiceBear avatarUrl (%s)', async (avatarUrl) => {
    const { repo, update } = buildRepo();
    const useCase = new UpdateAssistantProfileUseCase(repo);

    await useCase.execute('u-1', { avatarUrl });

    expect(update).toHaveBeenCalledWith('u-1', { avatarUrl });
  });

  it.each([
    'https://models.readyplayer.me/abc.glb',
    'https://evil.example.com/x.glb',
    'dicebear:notionists',
    'dicebear::seed',
    'dicebear:Notionists:felps',
    'notionists:felps',
    '',
  ])(
    'rejects an avatarUrl that does not match the DiceBear format (%s)',
    async (avatarUrl) => {
      const { repo, update } = buildRepo();
      const useCase = new UpdateAssistantProfileUseCase(repo);

      await expect(
        useCase.execute('u-1', { avatarUrl }),
      ).rejects.toBeInstanceOf(InvalidAvatarUrlError);
      expect(update).not.toHaveBeenCalled();
    },
  );
});
