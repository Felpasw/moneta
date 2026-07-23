import type { UsersRepository } from '~/users/domain/ports/users-repository';
import { UsersService } from '~/users/users.service';

const makeRepo = (
  overrides: Partial<UsersRepository> = {},
): UsersRepository => ({
  createWithPasswordCredential: jest.fn(),
  findByEmailWithPasswordCredential: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  updateNickname: jest.fn(),
  ...overrides,
});

describe('UsersService', () => {
  describe('findById', () => {
    it('returns the user snapshot from the repository', async () => {
      const snapshot = {
        id: 'user-1',
        email: 'a@b.com',
        name: 'Alice',
        onboardedAt: null,
      };
      const findById = jest.fn().mockResolvedValue(snapshot);
      const service = new UsersService(makeRepo({ findById }));

      await expect(service.findById('user-1')).resolves.toEqual(snapshot);
      expect(findById).toHaveBeenCalledWith('user-1');
    });

    it('returns null when the user does not exist', async () => {
      const findById = jest.fn().mockResolvedValue(null);
      const service = new UsersService(makeRepo({ findById }));

      await expect(service.findById('ghost')).resolves.toBeNull();
    });
  });

  describe('updateNickname', () => {
    it('delega ao repositório e propaga o resultado', async () => {
      const updateNickname = jest.fn().mockResolvedValue({ nickname: 'Felps' });
      const service = new UsersService(makeRepo({ updateNickname }));

      await expect(service.updateNickname('user-1', 'Felps')).resolves.toEqual({
        nickname: 'Felps',
      });
      expect(updateNickname).toHaveBeenCalledWith('user-1', 'Felps');
    });
  });
});
