import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

// logoUrl guarda a keyword da lib @edusites/bancos-brasil (usada no /web
// via svgBanco({ nome })), não uma URL. Banrisul não tem cobertura na lib
// e cai no fallback de iniciais no frontend.
const BANKS: Array<{
  name: string;
  compeCode: string;
  logoUrl: string | null;
}> = [
  { name: 'Banco do Brasil', compeCode: '001', logoUrl: 'bancodobrasil' },
  { name: 'Santander', compeCode: '033', logoUrl: 'santander' },
  { name: 'Banrisul', compeCode: '041', logoUrl: null },
  { name: 'Banco Inter', compeCode: '077', logoUrl: 'inter' },
  { name: 'XP Investimentos', compeCode: '102', logoUrl: 'xp' },
  { name: 'Caixa Econômica Federal', compeCode: '104', logoUrl: 'caixa' },
  { name: 'BTG Pactual', compeCode: '208', logoUrl: 'btg' },
  { name: 'Banco Original', compeCode: '212', logoUrl: 'original' },
  { name: 'Bradesco', compeCode: '237', logoUrl: 'bradesco' },
  { name: 'Nubank', compeCode: '260', logoUrl: 'nubank' },
  { name: 'PagBank', compeCode: '290', logoUrl: 'pagbank' },
  { name: 'Mercado Pago', compeCode: '323', logoUrl: 'mercadopago' },
  { name: 'Banco C6', compeCode: '336', logoUrl: 'c6' },
  { name: 'Itaú Unibanco', compeCode: '341', logoUrl: 'itau' },
  { name: 'PicPay', compeCode: '380', logoUrl: 'picpay' },
  { name: 'Banco Safra', compeCode: '422', logoUrl: 'safra' },
  { name: 'Banco Pan', compeCode: '623', logoUrl: 'pan' },
  { name: 'Banco BV', compeCode: '655', logoUrl: 'bv' },
  { name: 'Neon', compeCode: '735', logoUrl: 'neon' },
  { name: 'Sicredi', compeCode: '748', logoUrl: 'sicredi' },
  { name: 'Sicoob', compeCode: '756', logoUrl: 'sicoob' },
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
