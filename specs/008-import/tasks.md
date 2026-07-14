# Importação de extratos bancários (MNT-112 … MNT-121) — `[DEFERRED]`

> ⚠️ **Todo esse spec está DEFERRED.** Fica documentado pra retomar depois do V1 rodando (auth + assistente + transações + gráficos + onboarding). Enquanto isso, user cadastra transações manualmente (via chat).

## Contexto

Bancos brasileiros não têm padrão comum de exportação. Cada um tem CSV próprio, OFX inconsistente, ou só PDF. Fazer parser bespoke pra cada um vira manutenção infinita. A jogada é **combinar OFX genérico + parsers dedicados dos populares + fallback via LLM** (aproveita o OpenAI que já tá no stack) — cobre 100% dos casos com esforço razoável.

**Panorama dos formatos** (guia rápido pra retomar):

| Banco | CSV | OFX | Nota |
|---|---|---|---|
| Nubank | Colunas próprias | ✅ escondido | Muito popular, prioridade alta pra CSV parser |
| Itaú | Layout misto | ✅ | Datas dd/mm/yyyy |
| Bradesco | HTML/CSV | ✅ | 3-4 variantes históricas |
| Inter | CSV limpo | ✅ | Descrição junta contra-parte |
| C6 | Próprio | ⚠️ inconsistente | Datas UTC/local mistas |
| BB / CEF | PDF-only comum | Parcial | Requer OCR |
| Wise / Nomad | CSV bom | ❌ | Precisa conversão FX |

## Estratégia em camadas

1. **OFX genérico** — 1 parser cobre 60% (todos os grandes aceitam OFX). Lib: `ofx-js` ou similar
2. **CSV parsers dedicados** — Nubank, Inter, C6 (top populares). Detecção automática pelo header/sample
3. **LLM fallback** — gpt-4o (chat completion, NÃO Realtime) com structured output pra formatos desconhecidos. Custo estimado: ~$0.025 por extrato de 100 linhas
4. **PDF/OCR** — `[DEFERRED profundo]` — só se muito user reclamar

## Por que deve entrar depois

- Sem transações reais, LLM da conversa "conselheira" (specs/003, specs/009-advisory) não tem baseline pra dar conselho útil
- V1 sem import = user novo digita 3 meses de gastos ou desiste
- **Contra-argumento**: chat + tools funcionam pra digitar rápido também ("gastei 50 no ifood ontem" × N). Talvez seja tolerável no início
- Decidido: adia. Reavalia depois de V1 rodando + primeiros users reais

---

## Tasks (todas `[DEFERRED]`, sem detalhamento de sub-passos)

- [ ] **MNT-112** `[DEFERRED]` OFX parser genérico + endpoint `POST /import/ofx` (upload + parse + retorna preview)
- [ ] **MNT-113** `[DEFERRED]` Nubank CSV parser + detector heurístico (identifica formato pelo header)
- [ ] **MNT-114** `[DEFERRED]` Parsers Inter + C6 + detector estendido
- [ ] **MNT-115** `[DEFERRED]` LLM fallback — gpt-4o chat completion com structured output. Prompt: extraia transações do texto do extrato, marca `needs_review` quando incerto
- [ ] **MNT-116** `[DEFERRED]` Preview + bulk confirm flow — entity `import_sessions` (status pending/committed/discarded) + `import_rows` (raw_data JSONB, parsed_transaction JSONB, status ok/needs_review/rejected). User edita/deleta rows antes de commitar
- [ ] **MNT-117** `[DEFERRED]` Web `/import` — upload de arquivo, seleção de conta destino, preview de transações parseadas, edição inline, confirm
- [ ] **MNT-118** `[DEFERRED]` Deduplicação — evita inserir transação já existente (hash de `date + amount + description normalizada`). Mostra "N transações duplicadas serão ignoradas" no preview
- [ ] **MNT-119** `[DEFERRED]` Integração com onboarding (MNT-84) — passo opcional "quer importar seu extrato do último mês?" antes de finalizar
- [ ] **MNT-120** `[DEFERRED profundo]` PDF/OCR — Google Document AI (free 1k pgs/mês) OU Tesseract local + LLM pra estruturar. Só se demanda real aparecer
- [ ] **MNT-121** `[DEFERRED]` Golden tests com extratos reais **anonimizados** de 5+ bancos (fixtures em `test/fixtures/imports/`)

## Modelo de dados (sugerido, revisar quando retomar)

```
import_sessions {
  id UUID PK
  user_id UUID FK
  source VARCHAR      -- 'ofx' | 'nubank_csv' | 'inter_csv' | 'llm_fallback' | ...
  target_account_id UUID FK -> user_bank_accounts
  status VARCHAR      -- 'pending' | 'committed' | 'discarded'
  uploaded_at, committed_at TIMESTAMPTZ
}

import_rows {
  id UUID PK
  session_id UUID FK
  raw_data JSONB              -- linha original do arquivo
  parsed_transaction JSONB    -- draft do que vai virar transaction
  status VARCHAR              -- 'ok' | 'needs_review' | 'rejected' | 'duplicate'
  row_index INT
}
```

## Antes de retomar, decidir

- Batch size máximo por sessão (evitar upload de 10k linhas)
- Retenção de `import_rows` pós-commit (30 dias? sempre? deletar?)
- Preview mostra quantas linhas antes de confirmar
- UX quando muitas `needs_review` — cancelar tudo ou permitir commit parcial?

## Referências

- ofx-js: https://www.npmjs.com/package/ofx-js
- OpenAI structured output: https://platform.openai.com/docs/guides/structured-outputs
- Google Document AI: https://cloud.google.com/document-ai (pra PDF depois)
- [Product Brief](../000-product-brief/spec.md)
