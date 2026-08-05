import api from "@/api";

import type { Bank, IBanksService } from "./interfaces/banks.interface";

class BanksService implements IBanksService {
  async list(): Promise<Bank[]> {
    const { data } = await api.get<Bank[]>("/banks");

    return data;
  }
}

const banksService = new BanksService();

export default banksService;
