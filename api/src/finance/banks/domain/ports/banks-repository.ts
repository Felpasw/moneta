export const BANKS_REPOSITORY = Symbol('BANKS_REPOSITORY');

export interface Bank {
  id: string;
  name: string;
  compeCode: string;
  logoUrl: string | null;
}

export interface BanksRepository {
  listAll(): Promise<Bank[]>;
  findManyByIds(ids: string[]): Promise<Bank[]>;
}
