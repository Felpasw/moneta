/* eslint-disable @typescript-eslint/no-unsafe-declaration-merging, @typescript-eslint/no-empty-object-type --
 * PrismaService bridges Nest lifecycle (class methods) with the runtime-
 * extended PrismaClient (Decimal → number result extension). The declaration
 * merging brings the extended client's model accessors (`userBankAccount`,
 * `transaction`, `$transaction`, etc.) into the class type; the Proxy in
 * the constructor forwards property lookups to the internal `client` when
 * they are not defined on the class itself. Runtime is safe — the lint
 * cannot verify it.
 */
import {
  Injectable,
  type OnModuleDestroy,
  type OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient } from '@prisma/client';

import { env } from '../../config/env';

const decimalField = <F extends string>(field: F) => ({
  needs: { [field]: true } as { [K in F]: true },
  compute: (row: Record<F, Prisma.Decimal>): number => row[field].toNumber(),
});

const nullableDecimalField = <F extends string>(field: F) => ({
  needs: { [field]: true } as { [K in F]: true },
  compute: (row: Record<F, Prisma.Decimal | null>): number | null =>
    row[field]?.toNumber() ?? null,
});

const decimalToNumberExtension = Prisma.defineExtension({
  name: 'decimal-to-number',
  result: {
    userBankAccount: {
      balance: decimalField('balance'),
      creditLimit: nullableDecimalField('creditLimit'),
      overdraftLimit: nullableDecimalField('overdraftLimit'),
    },
    transaction: { amount: decimalField('amount') },
    transfer: { amount: decimalField('amount') },
    creditCardInvoice: { totalAmount: decimalField('totalAmount') },
    installmentGroup: {
      totalAmount: decimalField('totalAmount'),
      installmentAmount: decimalField('installmentAmount'),
    },
    category: { monthlyBudget: nullableDecimalField('monthlyBudget') },
  },
});

const buildExtendedClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  }).$extends(decimalToNumberExtension);

type ExtendedPrismaClient = ReturnType<typeof buildExtendedClient>;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly client: ExtendedPrismaClient;

  constructor() {
    this.client = buildExtendedClient();
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        if (prop in target) return Reflect.get(target, prop, receiver);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- Proxy forward
        return Reflect.get(this.client, prop, this.client);
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export interface PrismaService extends ExtendedPrismaClient {}
