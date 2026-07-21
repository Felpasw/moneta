import { Inject, Injectable } from '@nestjs/common';

import {
  INSTALLMENT_GROUPS_REPOSITORY,
  type InstallmentGroupsRepository,
} from '../../domain/ports/installment-groups-repository';
import type { CancelInstallmentPurchaseOutput } from '../../domain/types/cancel-installment-purchase-output';

@Injectable()
export class CancelInstallmentPurchaseUseCase {
  constructor(
    @Inject(INSTALLMENT_GROUPS_REPOSITORY)
    private readonly groups: InstallmentGroupsRepository,
  ) {}

  async execute(input: {
    groupId: string;
    userId: string;
  }): Promise<CancelInstallmentPurchaseOutput> {
    return this.groups.cancelGroup(input.groupId, input.userId);
  }
}
