# 0001 — dayjs para manipulação de datas

**Data:** 2026-07-20
**Status:** Aceito

## Contexto

O projeto começou sem biblioteca de datas — toda manipulação era via `Date.UTC` nativo. Isso funcionou pra casos triviais (armazenar `occurredAt`, filtrar `dateFrom`/`dateTo` no Prisma), mas apareceu a primeira lógica não-trivial: `computeCycleForDate` (MNT-136, `src/finance/card-billing/domain/utils/cycle-math.ts`) que precisa de operações como:

- Adicionar/subtrair meses (com virada de ano)
- Último dia do mês (variando por mês, ano bissexto)
- Clamp de dia dentro do mês (`closeDay=31` em fevereiro cai pro 28)
- Comparação de datas por granularidade de dia

Fase 5+ do spec `004-transactions` trará mais desses: scheduler diário (`@Cron` MNT-138), materialização de N parcelas mensais (MNT-155), cálculo de datas de vencimento e histórico de faturas.

Implementar isso na mão com `Date.UTC(y, m+1, 0)` (trick pra último dia do mês) e `Date.UTC(y, -1, x)` (virada automática) funciona mas é semanticamente opaco — quem lê precisa decifrar o truque.

## Decisão

Adotar **dayjs 1.11** (+ plugin `utc`) como biblioteca oficial de manipulação de datas no backend.

## Alternativas consideradas

- **moment** — descartada. Em modo maintenance desde 2020 (recomendação dos próprios mantenedores: "legacy project"), API mutável (fonte de bugs), ~70KB, sem ESM oficial.
- **date-fns** — sólida (funcional, tree-shakes, imutável) mas API mais verbosa (`addMonths(date, 1)` em vez de `date.add(1, 'month')`), e UTC nativo só a partir de `@date-fns/utc` v3+.
- **luxon** — feita pelos ex-mantenedores do moment, imutável, TZ nativo — porém 20KB e API mais pesada. Melhor pra apps com muita lógica de timezone; aqui backend fica sempre em UTC.
- **Continuar nativo** — viável tecnicamente (o util caberia em ~15 linhas com `Date.UTC` trickery) mas ilegível para lógica mais complexa que virá.

## Consequências

**Positivas:**
- Bundle: +2KB min+gzip (dayjs é a menor das opções vivas)
- API familiar pra quem veio de moment/dayjs
- Imutável — `date.add(1, 'day')` retorna novo `Dayjs`, não muda o original
- Plugins opt-in (`utc`, `timezone`, `relativeTime`, `customParseFormat`) só carregam se importados
- Todos os `Dayjs` no código de domínio devem sair pra `Date` na fronteira (persistência/serialização) via `.toDate()`

**Negativas:**
- Uma dependência a mais pra manter atualizada
- Time novo precisa aprender API do dayjs (mitigado: é praticamente moment)

## Convenções

- **Sempre importar o plugin `utc` e usar `dayjs.utc(...)`** para lógica que envolve datas persistidas (schema Prisma usa `@db.Date` e `@db.Timestamptz`). Evita traps de timezone local do runtime.
- **Fronteira in/out:** funções de domínio recebem/retornam `Date` nativo. Dayjs vive só dentro do corpo. Isso mantém o port (interface) independente da lib e permite trocar amanhã sem mexer nos consumers.
- **Timezone display** (formatar pro user BR): quando entrar UI/relatórios, adotar o plugin `timezone` e centralizar em `@common/date/`. Não é escopo agora.

## Uso atual

- `src/finance/card-billing/domain/utils/cycle-math.ts` (MNT-136) — cálculo de ciclos de fatura de cartão

## Referências

- [dayjs docs](https://day.js.org)
- [Moment.js — Project Status](https://momentjs.com/docs/#/-project-status/) (justificativa da rejeição)
