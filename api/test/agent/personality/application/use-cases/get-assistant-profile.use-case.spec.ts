import { GetAssistantProfileUseCase } from '~/agent/personality/application/use-cases/get-assistant-profile.use-case';
import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import { ProfileNotFoundError } from '~/agent/personality/domain/errors/profile-not-found.error';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { AssistantProfile } from '~/agent/personality/domain/types/assistant-profile';

const PROFILE: AssistantProfile = {
  id: 'p-1',
  userId: 'u-1',
  treatmentStyle: TreatmentStyle.Informal,
  voiceId: 'v-1',
  avatarUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const buildRepo = (): {
  repo: AssistantProfileRepository;
  findByUserId: jest.Mock;
} => {
  const findByUserId = jest.fn();
  return {
    repo: {
      findByUserId,
      create: jest.fn(),
      update: jest.fn(),
    },
    findByUserId,
  };
};

describe('GetAssistantProfileUseCase', () => {
  it('returns the profile of the given userId', async () => {
    const { repo, findByUserId } = buildRepo();
    findByUserId.mockResolvedValue(PROFILE);
    const useCase = new GetAssistantProfileUseCase(repo);

    const result = await useCase.execute('u-1');

    expect(findByUserId).toHaveBeenCalledWith('u-1');
    expect(result).toBe(PROFILE);
  });

  it('throws ProfileNotFoundError when the profile does not exist', async () => {
    const { repo, findByUserId } = buildRepo();
    findByUserId.mockResolvedValue(null);
    const useCase = new GetAssistantProfileUseCase(repo);

    await expect(useCase.execute('u-none')).rejects.toBeInstanceOf(
      ProfileNotFoundError,
    );
  });
});
