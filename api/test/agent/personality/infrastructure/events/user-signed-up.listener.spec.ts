import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import type { AssistantProfileRepository } from '~/agent/personality/domain/ports/assistant-profile-repository';
import type { CreateAssistantProfileInput } from '~/agent/personality/domain/types/create-assistant-profile-input';
import { UserSignedUpListener } from '~/agent/personality/infrastructure/events/user-signed-up.listener';
import type { UserSignedUpPayload } from '~/auth/domain/events/user-signed-up.event';

const buildRepo = (): {
  repo: AssistantProfileRepository;
  create: jest.Mock;
  findByUserId: jest.Mock;
} => {
  const findByUserId = jest
    .fn<Promise<null | { userId: string }>, [string]>()
    .mockResolvedValue(null);
  const create = jest
    .fn<Promise<{ id: string }>, [CreateAssistantProfileInput]>()
    .mockImplementation((input) =>
      Promise.resolve({
        id: 'profile-1',
        ...input,
      }),
    );
  return {
    repo: {
      findByUserId,
      create,
    } as unknown as AssistantProfileRepository,
    create,
    findByUserId,
  };
};

const payload: UserSignedUpPayload = {
  userId: 'user-42',
  email: 'alice@example.com',
  name: 'Alice',
};

describe('UserSignedUpListener', () => {
  it('creates a default profile with informal treatment style and voiceId from the injected default', async () => {
    const { repo, create } = buildRepo();
    const listener = new UserSignedUpListener(repo, {
      defaultVoiceId: 'voice-default',
    });

    await listener.handle(payload);

    expect(create).toHaveBeenCalledWith({
      userId: 'user-42',
      treatmentStyle: TreatmentStyle.Informal,
      voiceId: 'voice-default',
      avatarUrl: null,
    });
  });

  it('is idempotent — does not recreate a profile that already exists', async () => {
    const { repo, create, findByUserId } = buildRepo();
    findByUserId.mockResolvedValue({ userId: 'user-42' });
    const listener = new UserSignedUpListener(repo, {
      defaultVoiceId: 'voice-default',
    });

    await listener.handle(payload);

    expect(findByUserId).toHaveBeenCalledWith('user-42');
    expect(create).not.toHaveBeenCalled();
  });
});
