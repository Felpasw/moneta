import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BANKS: Array<{ name: string; compeCode: string }> = [
  { name: 'Banco do Brasil', compeCode: '001' },
  { name: 'Santander', compeCode: '033' },
  { name: 'Banrisul', compeCode: '041' },
  { name: 'Banco Inter', compeCode: '077' },
  { name: 'XP Investimentos', compeCode: '102' },
  { name: 'Caixa Econômica Federal', compeCode: '104' },
  { name: 'BTG Pactual', compeCode: '208' },
  { name: 'Banco Original', compeCode: '212' },
  { name: 'Bradesco', compeCode: '237' },
  { name: 'Nubank', compeCode: '260' },
  { name: 'PagBank', compeCode: '290' },
  { name: 'Mercado Pago', compeCode: '323' },
  { name: 'Banco C6', compeCode: '336' },
  { name: 'Itaú Unibanco', compeCode: '341' },
  { name: 'PicPay', compeCode: '380' },
  { name: 'Banco Safra', compeCode: '422' },
  { name: 'Banco Pan', compeCode: '623' },
  { name: 'Banco BV', compeCode: '655' },
  { name: 'Neon', compeCode: '735' },
  { name: 'Sicredi', compeCode: '748' },
  { name: 'Sicoob', compeCode: '756' },
];

const DEFAULT_CATEGORIES: string[] = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Salário',
  'Investimentos',
  'Outros',
];

async function seedBanks(): Promise<void> {
  await prisma.bank.createMany({
    data: BANKS,
    skipDuplicates: true,
  });
}

async function seedDefaultCategories(): Promise<void> {
  for (const name of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: { userId: null, name },
    });
    if (existing) continue;
    await prisma.category.create({
      data: { name, userId: null },
    });
  }
}

async function main(): Promise<void> {
  await seedBanks();
  await seedDefaultCategories();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
