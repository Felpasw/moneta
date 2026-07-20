import { z } from 'zod';

import { AccountNotFoundError } from '../../../finance/accounts/domain/errors/account-not-found.error';
import { AddInstallmentPurchaseUseCase } from '../../../finance/card-billing/installments/application/use-cases/add-installment-purchase.use-case';
import { InstallmentPurchaseNotAllowedError } from '../../../finance/card-billing/installments/domain/errors/installment-purchase-not-allowed.error';
import { InvalidInstallmentAmountsError } from '../../../finance/card-billing/installments/domain/errors/invalid-installment-amounts.error';
import { InvalidInstallmentsCountError } from '../../../finance/card-billing/installments/domain/errors/invalid-installments-count.error';
import type {
  AssistantContext,
  AssistantTool,
  AssistantToolResult,
} from '../domain/assistant-tool';
import { RegisterAssistantTool } from '../infrastructure/register-assistant-tool.decorator';

const inputSchema = z
  .object({
    accountId: z.uuid(),
    totalAmount: z.number().positive().optional(),
    installmentAmount: z.number().positive().optional(),
    installmentsCount: z.number().int().min(2).max(48),
    description: z.string().min(1).max(255),
    categoryId: z.uuid().optional(),
    occurredAt: z.iso.datetime().transform((s) => new Date(s)),
  })
  .refine(
    (v) => v.totalAmount !== undefined || v.installmentAmount !== undefined,
    { message: 'Provide totalAmount OR installmentAmount' },
  );

@RegisterAssistantTool()
export class AddInstallmentPurchaseTool implements AssistantTool {
  readonly name = 'add_installment_purchase';
  readonly description =
    'Registers a credit card purchase split into N monthly installments. Materializes N transactions (one per parcel) with occurredAt one month apart starting from the purchase date, each linked to the invoice of its cycle. Only valid on credit card accounts (creditLimit != null).';
  readonly jsonSchema = {
    type: 'object',
    properties: {
      accountId: { type: 'string', format: 'uuid' },
      totalAmount: { type: 'number', exclusiveMinimum: 0 },
      installmentAmount: { type: 'number', exclusiveMinimum: 0 },
      installmentsCount: { type: 'integer', minimum: 2, maximum: 48 },
      description: { type: 'string', minLength: 1, maxLength: 255 },
      categoryId: { type: 'string', format: 'uuid' },
      occurredAt: { type: 'string', format: 'date-time' },
    },
    required: ['accountId', 'installmentsCount', 'description', 'occurredAt'],
    additionalProperties: false,
  };
  readonly playbook =
    'Registra compra parcelada em cartão de crédito. Regras críticas: (1) Só aceita conta cartão (creditLimit != null); débito é rejeitado — pra compra em débito, o user precisa usar a tool comum de registrar transação. (2) Reconhecer expressões PT-BR: "3x de 100", "R$4800 em 12 vezes", "parcelei em 6", "12 parcelas de 400", "6 vezes de 250". User pode informar VALOR TOTAL ou VALOR DA PARCELA — passe o que ele disser, deriva o outro; nunca invente. (3) Confirme ANTES de invocar: total OU valor da parcela + quantidade de parcelas + descrição + data. (4) Sem juros: registra parcelas iguais (soma linear). Diferenças de arredondamento vão pra última parcela. Se user mencionar juros ou parcelas com valores diferentes, avise que essa tool não suporta e ofereça registrar cada parcela como transação normal com valores exatos. (5) Cada parcela vira uma transação com descrição "PS5 (3/12)" formato e occurredAt deslocado em N meses; cada parcela cai em fatura diferente automaticamente. (6) installmentsCount mínimo 2 (compra 1x é transação normal); teto 48 (4 anos, defensivo).';

  constructor(
    private readonly addInstallmentPurchase: AddInstallmentPurchaseUseCase,
  ) {}

  async execute(
    input: unknown,
    ctx: AssistantContext,
  ): Promise<AssistantToolResult> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        error: `Invalid input: ${parsed.error.issues.map((i) => i.message).join('; ')}`,
      };
    }
    try {
      const result = await this.addInstallmentPurchase.execute({
        userId: ctx.userId,
        accountId: parsed.data.accountId,
        totalAmount: parsed.data.totalAmount,
        installmentAmount: parsed.data.installmentAmount,
        installmentsCount: parsed.data.installmentsCount,
        description: parsed.data.description,
        categoryId: parsed.data.categoryId,
        occurredAt: parsed.data.occurredAt,
      });
      return { ok: true, data: result };
    } catch (e) {
      if (
        e instanceof AccountNotFoundError ||
        e instanceof InstallmentPurchaseNotAllowedError ||
        e instanceof InvalidInstallmentsCountError ||
        e instanceof InvalidInstallmentAmountsError
      ) {
        return { ok: false, error: e.message };
      }
      throw e;
    }
  }
}
