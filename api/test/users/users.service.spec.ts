import { UsersService } from '~/users/users.service';
import type { UsersRepository } from '~/users/domain/ports/users-repository';

const makeRepo = (
  findById: jest.Mock,
): UsersRepository =>
  ({
    findById,
    findByEmail: jest.fn(),
    findByEmailWithPasswordCredential: jest.fn(),
    createWithPasswordCredential: jest.fn(),
  }) as unknown as UsersRepository;

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
      const service = new UsersService(makeRepo(findById));

      await expect(service.findById('user-1')).resolves.toEqual(snapshot);
      expect(findById).toHaveBeenCalledWith('user-1');
    });

    it('returns null when the user does not exist', async () => {
      const findById = jest.fn().mockResolvedValue(null);
      const service = new UsersService(makeRepo(findById));

      await expect(service.findById('ghost')).resolves.toBeNull();
    });
  });
});
