import { TreatmentStyle } from '~/agent/personality/domain/constants/treatment-style';
import { PrismaAssistantProfileRepository } from '~/agent/personality/infrastructure/repositories/prisma-assistant-profile.repository';
import type { PrismaService } from '~/infrastructure/prisma/prisma.service';

const CREATED_PROFILE = {
  id: 'profile-1',
  userId: 'user-1',
  treatmentStyle: 'informal' as const,
  voiceId: 'voice-42',
  avatarUrl: null,
  createdAt: new Date('2026-07-16T10:00:00Z'),
  updatedAt: new Date('2026-07-16T10:00:00Z'),
};

interface FakeAssistantProfileDelegate {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
}

const makePrisma = (
  delegate: Partial<FakeAssistantProfileDelegate>,
): PrismaService =>
  ({ assistantProfile: delegate }) as unknown as PrismaService;

describe('PrismaAssistantProfileRepository', () => {
  describe('create', () => {
    it('persists a new profile via prisma.assistantProfile.create and returns the domain projection', async () => {
      const create = jest.fn().mockResolvedValue(CREATED_PROFILE);
      const repo = new PrismaAssistantProfileRepository(makePrisma({ create }));

      const result = await repo.create({
        userId: 'user-1',
        treatmentStyle: TreatmentStyle.Informal,
        voiceId: 'voice-42',
        avatarUrl: null,
      });

      expect(create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          treatmentStyle: 'informal',
          voiceId: 'voice-42',
          avatarUrl: null,
        },
      });
      expect(result).toEqual({
        id: 'profile-1',
        userId: 'user-1',
        treatmentStyle: TreatmentStyle.Informal,
        voiceId: 'voice-42',
        avatarUrl: null,
        createdAt: CREATED_PROFILE.createdAt,
        updatedAt: CREATED_PROFILE.updatedAt,
      });
    });

    it('forwards avatarUrl when provided', async () => {
      const create = jest.fn().mockResolvedValue({
        ...CREATED_PROFILE,
        avatarUrl: 'https://models.readyplayer.me/xyz.glb',
      });
      const repo = new PrismaAssistantProfileRepository(makePrisma({ create }));

      const result = await repo.create({
        userId: 'user-1',
        treatmentStyle: TreatmentStyle.Formal,
        voiceId: 'v1',
        avatarUrl: 'https://models.readyplayer.me/xyz.glb',
      });

      const calls = create.mock.calls as [[{ data: { avatarUrl: unknown } }]];
      expect(calls[0][0].data.avatarUrl).toBe(
        'https://models.readyplayer.me/xyz.glb',
      );
      expect(result.avatarUrl).toBe('https://models.readyplayer.me/xyz.glb');
    });
  });

  describe('findByUserId', () => {
    it('returns the profile when it exists', async () => {
      const findUnique = jest.fn().mockResolvedValue(CREATED_PROFILE);
      const repo = new PrismaAssistantProfileRepository(
        makePrisma({ findUnique }),
      );

      const result = await repo.findByUserId('user-1');

      expect(findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result?.userId).toBe('user-1');
    });

    it('returns null when the profile does not exist', async () => {
      const findUnique = jest.fn().mockResolvedValue(null);
      const repo = new PrismaAssistantProfileRepository(
        makePrisma({ findUnique }),
      );

      const result = await repo.findByUserId('user-none');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('patches only the provided fields via prisma.assistantProfile.update and returns the updated row', async () => {
      const update = jest.fn().mockResolvedValue({
        ...CREATED_PROFILE,
        treatmentStyle: 'formal',
        avatarUrl: 'https://models.readyplayer.me/xyz.glb',
      });
      const repo = new PrismaAssistantProfileRepository(makePrisma({ update }));

      const result = await repo.update('user-1', {
        treatmentStyle: TreatmentStyle.Formal,
        avatarUrl: 'https://models.readyplayer.me/xyz.glb',
      });

      expect(update).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        data: {
          treatmentStyle: TreatmentStyle.Formal,
          avatarUrl: 'https://models.readyplayer.me/xyz.glb',
        },
      });
      expect(result.treatmentStyle).toBe(TreatmentStyle.Formal);
      expect(result.avatarUrl).toBe('https://models.readyplayer.me/xyz.glb');
    });

    it('translates a Prisma P2025 (record not found) into ProfileNotFoundError', async () => {
      const notFound = Object.assign(new Error('not found'), {
        code: 'P2025',
      });
      const update = jest.fn().mockRejectedValue(notFound);
      const repo = new PrismaAssistantProfileRepository(makePrisma({ update }));

      await expect(repo.update('user-none', { voiceId: 'v' })).rejects.toThrow(
        /profile.+user-none/i,
      );
    });
  });
});
