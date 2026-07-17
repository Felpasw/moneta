import { ListBanksUseCase } from '~/banks/application/use-cases/list-banks.use-case';
import type { Bank } from '~/banks/domain/ports/banks-repository';

const buildUseCase = () => {
  const banks = {
    listAll: jest.fn(),
  };
  const useCase = new ListBanksUseCase(banks);
  return { useCase, banks };
};

describe('ListBanksUseCase', () => {
  it('returns the full catalog from the repository', async () => {
    const { useCase, banks } = buildUseCase();
    const catalog: Bank[] = [
      { id: 'uuid-1', name: 'Nubank', compeCode: '260', logoUrl: null },
      { id: 'uuid-2', name: 'Itaú Unibanco', compeCode: '341', logoUrl: null },
    ];
    banks.listAll.mockResolvedValue(catalog);

    const result = await useCase.execute();

    expect(result).toEqual(catalog);
    expect(banks.listAll).toHaveBeenCalledTimes(1);
  });

  it('returns an empty array when catalog is empty', async () => {
    const { useCase, banks } = buildUseCase();
    banks.listAll.mockResolvedValue([]);

    const result = await useCase.execute();

    expect(result).toEqual([]);
  });
});
