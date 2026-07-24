export const BANK_ICON_SLUG: Record<string, string | null> = {
  "Banco do Brasil": "bancodobrasil",
  Santander: "santander",
  Banrisul: null,
  "Banco Inter": "inter",
  "XP Investimentos": "xp",
  "Caixa Econômica Federal": "caixa",
  "BTG Pactual": "btg",
  "Banco Original": "original",
  Bradesco: "bradesco",
  Nubank: "nubank",
  PagBank: "pagbank",
  "Mercado Pago": "mercadopago",
  "Banco C6": "c6",
  "Itaú Unibanco": "itau",
  PicPay: "picpay",
  "Banco Safra": "safra",
  "Banco Pan": "pan",
  "Banco BV": "bv",
  Neon: "neon",
  Sicredi: "sicredi",
  Sicoob: "sicoob",
};

export const resolveBankIconSlug = (bankName: string): string | null =>
  BANK_ICON_SLUG[bankName] ?? null;
