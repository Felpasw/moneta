export interface Bank {
  id: string;
  name: string;
  compeCode: string;
  logoUrl: string | null;
}

export interface IBanksService {
  list(): Promise<Bank[]>;
}
