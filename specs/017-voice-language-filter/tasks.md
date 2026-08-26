# Filtro de idioma e aviso de cross-language nas voices do assistente

**Status:** backlog.
**Motivação:** hoje a lista de voices em `AssistantSettingsVoice` mistura todas as línguas devolvidas pela ElevenLabs, corta cegamente nas 12 primeiras (`slice(0, 12)`) e não sinaliza pro user que uma voice em EN vai soar esquisita/imprevisível quando o `outputLanguage` do assistente é PT (e vice-versa). Resultado: o user seleciona uma voice bonita no preview, muda o idioma e leva susto na conversa real.

## Estado atual (o que já existe)

- **Backend** já entrega `language?: string` por voice — `api/src/agent/infrastructure/tts/providers/elevenlabs/utils/normalize-voice.ts:9` normaliza a partir do `labels.language` da ElevenLabs. Nenhuma mudança de shape necessária.
- **Cache de 5 min** no `ListAvailableVoicesUseCase` (`api/src/agent/application/use-cases/list-available-voices.use-case.ts:8`) — filtro no client não invalida cache.
- **`outputLanguage` do perfil** já é enum tipado (`"pt_BR" | "en_US"`) em `web/src/services/interfaces/assistantProfile.interface.ts:3`.
- **Tab `Voice`** hoje: `web/src/components/organisms/AssistantSettingsVoice.tsx` renderiza `voices.slice(0, MAX_VISIBLE_VOICES = 12)` sem filtro, mostra `voice.language` como texto secundário no card (linha 106-110).
- **Preferência do idioma** vive em outra tab (`AssistantSettingsLanguage`) — hoje sem qualquer link visual com a lista de voices.

## O que tá quebrado

- Lista mistura PT e EN sem separação — user tem que ler o subtítulo pequenininho pra descobrir qual é qual.
- `slice(0, 12)` corta silenciosamente. Se as 12 primeiras são todas EN, o user em PT nem vê que existem voices PT disponíveis.
- Nenhum sinal de que voice EN + `outputLanguage: pt_BR` = fala com sotaque estranho e prosódia quebrada (limitação real do TTS multilingual da ElevenLabs).
- Preview reproduz a voz no idioma nativo dela, o que **esconde** o problema — só aparece quando o assistente responde de verdade.

## Objetivo

Na tab `Voice`:

1. **Filtro visual** de idioma (chips `Todas / PT / EN`) acima da lista, pré-selecionado com o `outputLanguage` atual do perfil.
2. **Aviso global** curto no topo da seção informando que cross-language é imprevisível.
3. **Badge de mismatch** por card quando `voice.language` não bate com `profile.outputLanguage` (visível mesmo no filtro "Todas").
4. **Remover o cap de 12** — `ScrollArea` já resolve altura; filtro reduz o volume percebido.

Nada muda na pipeline TTS, no Realtime, nem no shape do port `TtsVoice`. É UX pura no /web.

## Referências cruzadas

| Depende de                                              | Spec origem       | Comentário |
|---------------------------------------------------------|-------------------|------------|
| Port `TtsVoice { language?: string }`                   | 003-assistant     | Fonte do idioma da voice |
| `AssistantProfile.outputLanguage: "pt_BR" \| "en_US"`   | 003-assistant     | Fonte do idioma alvo do assistente |
| `AssistantSettingsVoice.tsx`                            | 003-assistant     | Componente a evoluir |
| `AssistantSettingsLanguage.tsx`                         | 003-assistant     | Tab que grava `outputLanguage` — sem mudança, só leitura pelo store/hook |
| Feedback global: user-controlled fields → enum          | (memory)          | Filtro é enum discreto (`pt / en / all`), nunca free-text |
| Feedback global: no runtime language inference          | (memory)          | Idioma da voice vem do backend, mismatch vem de comparação enum vs enum — sem heurística |

## Decisões técnicas

- **Onde mora o filtro:** state local no `AssistantSettingsScreen` OU no próprio `AssistantSettingsVoice`. Escolhido: **`AssistantSettingsVoice`** — o filtro é 100% UI reativo, não persiste, não influencia outras tabs. Sem prop drilling nem lift.
- **Como derivar o idioma da voice pra comparar:** o backend devolve strings variadas (`"English"`, `"en"`, `"Portuguese (Brazil)"`, `"pt-BR"`...). Precisa de **normalizador puro** em `web/src/utils/voiceLanguage.ts` que retorna enum `VoiceLanguage = "pt" | "en" | "other"`. Sem `.map` de reshape em componente — helper puro testado isolado.
- **Default do filtro:** deriva do `profile.outputLanguage` (`pt_BR → pt`, `en_US → en`). Se o user trocar o filtro manualmente, respeita a escolha durante a sessão (sem persistir — próximo mount volta ao default do perfil).
- **Voices `language === "other"` (não classificáveis):** aparecem só no filtro `Todas`. Nunca em PT nem EN.
- **Voices `language === undefined`:** mesmo comportamento de `"other"`. Backend garantiu que campo é opcional, então "sem idioma declarado" ≠ "multilingual" — trata como desconhecido.
- **Badge de mismatch:** aparece SEMPRE que `normalize(voice.language) !== normalize(profile.outputLanguage)` E não é `other`. Texto curto (`"Cross-language"` ou ícone `AlertTriangle` com tooltip). Fica visível em qualquer filtro — especialmente no filtro "Todas", que é onde o user "arrisca" o mismatch.
- **Aviso global:** parágrafo curto na `header` da seção, abaixo do subtítulo atual. Sem componente novo — só um `<p>`.
- **Sem mudança de backend:** o shape `TtsVoice { language?: string }` fica. Se depois a gente quiser tipar `language: VoiceLanguage` no próprio port do backend, é spec separado (ver task DEFERRED).
- **Cap de 12:** removido. Se a lista ficar gigante em algum provider futuro, `ScrollArea.max-h-72` limita altura visual — scroll resolve.
- **i18n do filtro/aviso:** strings ficam em constantes locais do componente por enquanto (mesmo padrão dos outros settings). Se a app ganhar i18n de UI (não só `outputLanguage`), migra depois.

## Tasks

- [ ] **MNT-249** [T][S] **Helper puro `normalizeVoiceLanguage`** — criar `web/src/utils/voiceLanguage.ts` com:
  - `type VoiceLanguage = "pt" | "en" | "other"`
  - `normalizeVoiceLanguage(raw: string | undefined): VoiceLanguage` — matches heurísticos determinísticos: startsWith `"pt"` (case-insensitive) ou contém `"portuguese"` → `"pt"`; startsWith `"en"` ou contém `"english"` → `"en"`; resto (inclusive `undefined`) → `"other"`.
  - `normalizeOutputLanguage(lang: OutputLanguage): "pt" | "en"` — mapping direto (`pt_BR → "pt"`, `en_US → "en"`).
  - Teste em `web/src/utils/voiceLanguage.spec.ts` cobrindo: `"English"`, `"en"`, `"en-US"`, `"Portuguese (Brazil)"`, `"pt-BR"`, `"Spanish"`, `undefined`, `""`. Zero regex complexa — checagens explícitas.

- [ ] **MNT-250** [T][S] **Componente `VoiceLanguageFilter`** — novo organism `web/src/components/organisms/VoiceLanguageFilter.tsx`. Props: `{ value: VoiceLanguageFilterValue; onChange: (v) => void; disabled?: boolean }` onde `VoiceLanguageFilterValue = "all" | "pt" | "en"`. Renderiza 3 chips (shadcn `Button variant="outline"` ou similar já vendored), `aria-pressed`, teclado. Nada de estado interno — controlled. Teste em `web/src/components/organisms/VoiceLanguageFilter.spec.tsx` valida: click em cada chip chama `onChange` com o valor certo; `disabled` bloqueia clicks; `aria-pressed` reflete `value`.

- [ ] **MNT-251** [T][S] **Badge `VoiceCrossLanguageBadge`** — atom `web/src/components/atoms/VoiceCrossLanguageBadge.tsx`. Props: `{ voiceLanguage: VoiceLanguage; targetLanguage: "pt" | "en" }`. Renderiza `null` quando bate ou quando `voiceLanguage === "other"`. Quando não bate: ícone `AlertTriangle` (lucide) + tooltip curto explicando ("Voice not native to your assistant language — may sound unpredictable"). Teste: renderiza badge só nos casos de mismatch; a11y (role + label do tooltip).

- [ ] **MNT-252** [T][S] **Integração em `AssistantSettingsVoice`** — atualizar `web/src/components/organisms/AssistantSettingsVoice.tsx`:
  - Aceita nova prop `targetLanguage: OutputLanguage` (vem do `AssistantSettingsScreen` já que ele lê `profile.data.outputLanguage`).
  - Estado local `useState<VoiceLanguageFilterValue>` inicializado com `normalizeOutputLanguage(targetLanguage)`.
  - Filtragem: `voices.filter(v => filter === "all" || normalizeVoiceLanguage(v.language) === filter)`. **Sem reshape** — só filtro (permitido, é UI-local).
  - Remove `MAX_VISIBLE_VOICES` e o `slice`.
  - Renderiza `<VoiceLanguageFilter />` acima da grid e `<VoiceCrossLanguageBadge />` dentro de cada card.
  - Aviso global (novo `<p>` na `motion.header`): texto curto pt/en-agnostic ("Voices work best in their native language. Cross-language use may sound off.").
  - Empty state quando o filtro esvazia a lista: mensagem "Nenhuma voz nesse idioma" (ou EN equivalente) com CTA "Show all" que chama `setFilter("all")`.
  - Atualiza `AssistantSettingsScreen.tsx` pra passar `targetLanguage={profile.data.outputLanguage}`.
  - Testes em `web/src/components/organisms/AssistantSettingsVoice.spec.tsx` (criar se não existir): (1) monta com `outputLanguage: pt_BR` e mostra só voices PT + "other" ocultas; (2) toggle pra "Todas" mostra todas + badges nas EN; (3) toggle pra "EN" mostra só EN sem badge (target já é EN? — cuidado: nesse caso `targetLanguage` continua pt_BR, então TODAS EN ganham badge — validar exatamente esse comportamento); (4) filtro vazio → empty state com CTA; (5) preview e select seguem funcionando com filtro ativo.

- [ ] **MNT-253** [T][P][DEFERRED] **Tipar `language` como enum no port do backend** — hoje `TtsVoice.language?: string`. Migrar pra `language?: VoiceLanguage` no `api/src/agent/domain/ports/tts-service.ts` + `normalize-voice.ts` chamando o mesmo helper (duplicado ou compartilhado via lib). Vantagem: elimina normalização no client. Desvantagem: mudança de contrato, requer versionar cache do `ListAvailableVoicesUseCase`. Deferrable — MNT-249..252 já resolvem o problema do user.

## Sinais de aceite (Definition of Done)

- Tab `Voice` mostra chips `Todas / PT / EN` acima da lista, com o chip do idioma atual pré-selecionado.
- Aviso global visível no topo da seção sem ocupar muito espaço.
- Badge de "cross-language" aparece em cada card de voice cujo idioma nativo difere do `outputLanguage` do assistente (exceto voices `"other"`).
- Cap de 12 removido — todas as voices do filtro atual aparecem, com scroll na `ScrollArea`.
- Trocar o filtro pra "Todas" revela as voices antes escondidas, com badges destacando mismatches.
- Filtro sem resultado exibe empty state com ação pra voltar ao "Todas".
- `AssistantSettingsLanguage` continua funcionando idêntico — nenhuma regressão nas outras tabs.
- Todos os testes verdes: `voiceLanguage.spec.ts`, `VoiceLanguageFilter.spec.tsx`, `VoiceCrossLanguageBadge.spec.tsx`, `AssistantSettingsVoice.spec.tsx`.
- Lint verde no /web sem ajustes.

## Decisões pendentes (não bloqueia rascunho)

- Persistir a última escolha de filtro do user (localStorage) ou sempre resetar pra `outputLanguage` no mount? Decisão inicial: **resetar**, mais previsível e o custo de refiltar é zero.
- Suportar mais idiomas além de PT/EN no filtro (ES, FR, DE)? Fora do escopo. Se aparecer, `VoiceLanguage` ganha membros e o filtro vira `Select` em vez de chips.
- Preview em duas línguas (nativo da voice + `outputLanguage` do user) pra o user ouvir o "risco" antes de escolher? Ideia interessante, mas exige mudar API de preview pra aceitar texto/idioma. Fora do MVP desse spec.
- Mostrar a badge também dentro de um tooltip do preview button (dupla sinalização) ou só no card? Manter só no card por enquanto — menos ruído.
