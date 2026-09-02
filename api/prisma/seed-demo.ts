import { PrismaPg } from '@prisma/adapter-pg';
import {
  CredentialType,
  OutputLanguage,
  PrismaClient,
  TransactionType,
  TreatmentStyle,
} from '@prisma/client';
import * as argon2 from 'argon2';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const DEMO = {
  email: 'demo@moneta.dev',
  password: 'Moneta123!',
  name: 'Demo User',
};

const MONTHS_BACK = 18;

interface BankSeed {
  name: string;
  compeCode: string;
  logoUrl: string | null;
  accountNickname: string;
  balance: number;
  creditLimit?: number;
  closeDay?: number;
  dueDay?: number;
}

const BANK_ACCOUNTS: BankSeed[] = [
  {
    name: 'Nubank',
    compeCode: '260',
    logoUrl: 'nubank',
    accountNickname: 'Nubank NuConta',
    balance: 4200.5,
    creditLimit: 8000,
    closeDay: 20,
    dueDay: 27,
  },
  {
    name: 'Banco Inter',
    compeCode: '077',
    logoUrl: 'inter',
    accountNickname: 'Inter Corrente',
    balance: 12500.75,
    creditLimit: 15000,
    closeDay: 5,
    dueDay: 12,
  },
  {
    name: 'Banco do Brasil',
    compeCode: '001',
    logoUrl: 'bancodobrasil',
    accountNickname: 'BB Salário',
    balance: 850.4,
  },
  {
    name: 'BTG Pactual',
    compeCode: '208',
    logoUrl: 'btg',
    accountNickname: 'BTG Investimentos',
    balance: 28500.0,
  },
];

const CATEGORIES = [
  { name: 'Food', icon: 'ShoppingCart', color: '#f97316' },
  { name: 'Transport', icon: 'Car', color: '#3b82f6' },
  { name: 'Housing', icon: 'Home', color: '#8b5cf6' },
  { name: 'Health', icon: 'HeartPulse', color: '#ef4444' },
  { name: 'Leisure', icon: 'Gamepad2', color: '#ec4899' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#14b8a6' },
  { name: 'Subscriptions', icon: 'Repeat', color: '#a855f7' },
  { name: 'Education', icon: 'GraduationCap', color: '#22c55e' },
  { name: 'Salary', icon: 'Landmark', color: '#10b981' },
  { name: 'Bonus', icon: 'Gift', color: '#f59e0b' },
];

interface RecurringTemplate {
  category: string;
  description: string;
  amount: number;
  type: TransactionType;
  dayOfMonth: number;
  accountIndex: number;
  jitter?: number;
}

const RECURRING: RecurringTemplate[] = [
  {
    category: 'Salary',
    description: 'Salário mensal',
    amount: 8500,
    type: TransactionType.income,
    dayOfMonth: 5,
    accountIndex: 2,
    jitter: 0,
  },
  {
    category: 'Housing',
    description: 'Aluguel',
    amount: 2500,
    type: TransactionType.expense,
    dayOfMonth: 10,
    accountIndex: 1,
  },
  {
    category: 'Housing',
    description: 'Conta de luz',
    amount: 180,
    type: TransactionType.expense,
    dayOfMonth: 15,
    accountIndex: 1,
    jitter: 40,
  },
  {
    category: 'Housing',
    description: 'Internet',
    amount: 120,
    type: TransactionType.expense,
    dayOfMonth: 12,
    accountIndex: 1,
  },
  {
    category: 'Housing',
    description: 'Conta de água',
    amount: 90,
    type: TransactionType.expense,
    dayOfMonth: 18,
    accountIndex: 1,
    jitter: 15,
  },
  {
    category: 'Subscriptions',
    description: 'Netflix',
    amount: 55.9,
    type: TransactionType.expense,
    dayOfMonth: 8,
    accountIndex: 0,
  },
  {
    category: 'Subscriptions',
    description: 'Spotify',
    amount: 21.9,
    type: TransactionType.expense,
    dayOfMonth: 3,
    accountIndex: 0,
  },
  {
    category: 'Subscriptions',
    description: 'iCloud',
    amount: 14.9,
    type: TransactionType.expense,
    dayOfMonth: 22,
    accountIndex: 0,
  },
];

interface VariableTemplate {
  category: string;
  descriptions: string[];
  minAmount: number;
  maxAmount: number;
  perMonth: number;
  type: TransactionType;
}

const VARIABLE: VariableTemplate[] = [
  {
    category: 'Food',
    descriptions: [
      'Mercado extra',
      'Padaria',
      'Feira',
      'Delivery iFood',
      'Restaurante centro',
      'Hamburgueria',
      'Sushi',
      'Cafeteria',
    ],
    minAmount: 25,
    maxAmount: 350,
    perMonth: 12,
    type: TransactionType.expense,
  },
  {
    category: 'Transport',
    descriptions: [
      'Uber',
      '99 Táxi',
      'Combustível',
      'Estacionamento',
      'Passagem ônibus',
    ],
    minAmount: 10,
    maxAmount: 220,
    perMonth: 10,
    type: TransactionType.expense,
  },
  {
    category: 'Leisure',
    descriptions: [
      'Cinema',
      'Show',
      'Bar com amigos',
      'Livraria',
      'Steam',
      'PlayStation Store',
    ],
    minAmount: 30,
    maxAmount: 400,
    perMonth: 4,
    type: TransactionType.expense,
  },
  {
    category: 'Shopping',
    descriptions: [
      'Amazon',
      'Mercado Livre',
      'Zara',
      'Renner',
      'Loja de eletrônicos',
    ],
    minAmount: 40,
    maxAmount: 800,
    perMonth: 3,
    type: TransactionType.expense,
  },
  {
    category: 'Health',
    descriptions: [
      'Farmácia Drogasil',
      'Consulta médica',
      'Academia',
      'Suplementos',
    ],
    minAmount: 45,
    maxAmount: 350,
    perMonth: 3,
    type: TransactionType.expense,
  },
  {
    category: 'Education',
    descriptions: [
      'Curso online',
      'Livro técnico',
      'Assinatura de blog',
    ],
    minAmount: 30,
    maxAmount: 400,
    perMonth: 1,
    type: TransactionType.expense,
  },
  {
    category: 'Bonus',
    descriptions: ['PLR', 'Freelance', 'Reembolso trabalho'],
    minAmount: 500,
    maxAmount: 3500,
    perMonth: 0.2,
    type: TransactionType.income,
  },
];

const randomBetween = (min: number, max: number): number =>
  Math.round((Math.random() * (max - min) + min) * 100) / 100;

const pickOne = <T>(list: readonly T[]): T =>
  list[Math.floor(Math.random() * list.length)];

const dayInMonth = (year: number, month: number, day: number): Date => {
  const last = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clamped = Math.min(day, last);
  const hour = Math.floor(Math.random() * 20) + 2;
  const minute = Math.floor(Math.random() * 60);
  return new Date(Date.UTC(year, month, clamped, hour, minute));
};

const wipeExistingUser = async (): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email: DEMO.email } });
  if (!user) return;
  await prisma.user.delete({ where: { id: user.id } });
  console.log(`⚠  removed previous demo user ${user.id}`);
};

const upsertBank = async (seed: BankSeed) => {
  return prisma.bank.upsert({
    where: { compeCode: seed.compeCode },
    update: {},
    create: {
      name: seed.name,
      compeCode: seed.compeCode,
      logoUrl: seed.logoUrl,
    },
  });
};

async function seed(): Promise<void> {
  await wipeExistingUser();

  const passwordHash = await argon2.hash(DEMO.password);

  const voiceId = process.env.TTS_DEFAULT_VOICE_ID ?? 'default-voice';

  const user = await prisma.user.create({
    data: {
      email: DEMO.email,
      name: DEMO.name,
      onboardedAt: new Date(),
      credentials: {
        create: { type: CredentialType.password, hash: passwordHash },
      },
      assistantProfile: {
        create: {
          treatmentStyle: TreatmentStyle.informal,
          outputLanguage: OutputLanguage.pt_BR,
          voiceId,
        },
      },
    },
  });
  console.log(`✅ user ${user.email} (${user.id})`);

  const banks = await Promise.all(BANK_ACCOUNTS.map(upsertBank));

  const accounts = await Promise.all(
    BANK_ACCOUNTS.map(async (seed, idx) =>
      prisma.userBankAccount.create({
        data: {
          userId: user.id,
          bankId: banks[idx].id,
          nickname: seed.accountNickname,
          balance: seed.balance,
          creditLimit: seed.creditLimit ?? null,
          closeDay: seed.closeDay ?? null,
          dueDay: seed.dueDay ?? null,
        },
      }),
    ),
  );
  console.log(`✅ ${accounts.length} accounts across ${banks.length} banks`);

  const categoriesByName = new Map<string, string>();
  for (const cat of CATEGORIES) {
    const created = await prisma.category.create({
      data: {
        userId: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
      },
    });
    categoriesByName.set(cat.name, created.id);
  }
  console.log(`✅ ${categoriesByName.size} categories`);

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  let totalTransactions = 0;

  for (let offset = MONTHS_BACK; offset >= 0; offset--) {
    const targetMonth = currentMonth - offset;
    const year = currentYear + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;

    for (const rec of RECURRING) {
      const jittered =
        rec.jitter && rec.jitter > 0
          ? rec.amount + randomBetween(-rec.jitter, rec.jitter)
          : rec.amount;
      await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: accounts[rec.accountIndex].id,
          categoryId: categoriesByName.get(rec.category) ?? null,
          type: rec.type,
          amount: Math.max(1, jittered),
          description: rec.description,
          occurredAt: dayInMonth(year, month, rec.dayOfMonth),
        },
      });
      totalTransactions++;
    }

    for (const variable of VARIABLE) {
      const count =
        variable.perMonth < 1
          ? Math.random() < variable.perMonth
            ? 1
            : 0
          : Math.max(
              1,
              Math.round(variable.perMonth + randomBetween(-2, 2)),
            );
      for (let i = 0; i < count; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const accountId = accounts[Math.floor(Math.random() * accounts.length)]
          .id;
        await prisma.transaction.create({
          data: {
            userId: user.id,
            accountId,
            categoryId: categoriesByName.get(variable.category) ?? null,
            type: variable.type,
            amount: randomBetween(variable.minAmount, variable.maxAmount),
            description: pickOne(variable.descriptions),
            occurredAt: dayInMonth(year, month, day),
          },
        });
        totalTransactions++;
      }
    }
  }

  console.log(
    `✅ ${totalTransactions} transactions across ${MONTHS_BACK + 1} months`,
  );
  console.log(`
🎉 Demo user ready!
   email:    ${DEMO.email}
   password: ${DEMO.password}
   accounts: ${accounts.length}
   months:   ${MONTHS_BACK + 1}
   txns:     ${totalTransactions}
`);
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
