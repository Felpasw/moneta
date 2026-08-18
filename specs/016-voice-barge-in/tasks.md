# Barge-in de voz — interromper o agente quando o user começa a falar

**Status:** backlog.
**Motivação:** hoje, se o agente tá falando (TTS tocando) e o user começa a falar, o áudio do assistente NÃO para. O user precisa esperar a resposta terminar ou clicar em algum controle. Isso quebra a UX de conversa natural.

## Estado atual (o que já existe)

- **Upstream (OpenAI Realtime)** já detecta o início da fala do user (`server_vad`) e emite `input_audio_buffer.speech_started`.
- **Back (`wire-tts-tap.ts:65`)** já reage ao evento chamando `pipeline.cancel()` — o pipeline TTS **para de sintetizar** novos chunks e emite `tts.audio.canceled` pro client.
- **Front (`useAgentSession.ts:97`)** recebe `tts.audio.canceled` e limpa `chunksRef.current = []`.

## O que tá quebrado

- **Chunks já assemblados e tocando não param.** No fluxo atual:
  1. `onDelta` acumula bytes em `chunksRef`.
  2. `onDone` monta o Blob, cria `new Audio(url)`, joga em `audioRef.current` e chama `audio.play()`.
  3. Quando `tts.audio.canceled` chega, `chunksRef` já foi consumido (fase 2 já rolou). Limpar o array não afeta nada.
  4. **`audioRef.current` continua tocando** até o fim natural.
- Resultado: user fala → back detecta → back manda cancel → front ignora efetivamente → assistente segue falando até acabar → só ENTÃO o próximo turn processa a fala do user.

## Objetivo

Quando o user começa a falar, o áudio local do assistente **para imediatamente** (dentro de ~100ms) e a UI reflete o estado de listening.

## Referências cruzadas

| Depende de                                            | Spec origem       | Comentário |
|-------------------------------------------------------|-------------------|------------|
| WS gateway `/agent/ws`                                | 003-assistant     | Bridge cliente↔Realtime |
| `wire-tts-tap.ts` já emite `tts.audio.canceled`       | 003-assistant     | Backend side pronto |
| `server_vad` no `session.update`                      | 013-voice-duplex  | Já configurado (MNT-194) |
| Hook `useAgentSession` `onCanceled`                   | 013-voice-duplex  | Ponto que precisa parar `audioRef.current` |
| `AgentSessionStatus` (Speaking/Listening)             | 009-ui-shell      | Estado precisa refletir a interrupção |

## Decisões técnicas

- **Onde para o áudio:** front. O upstream OpenAI já cancela a síntese; o buffer local que ficou tocando é responsabilidade do cliente parar.
- **Como parar:** `audioRef.current?.pause()` + `URL.revokeObjectURL(objectUrlRef.current)` + `audioRef.current = null` no `onCanceled`.
- **Estado após interrupção:** `AgentSessionStatus.Listening` (o user tá falando; o back vai processar e responder). NÃO ir pra `Error`.
- **Debounce/threshold:** confia no `server_vad` (config já ajustada: `threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500`). Sem lógica extra no client — cliente reage ao evento; upstream decide quando.
- **Race condition (delta chegando depois do cancel):** os chunks pós-cancel devem ser dropados. Guarda um flag `isCanceling` que zera no próximo `onDelta` inicial (novo turn detectado pelo primeiro delta subsequente ao done anterior).
- **Fade out vs cut abrupto:** cut abrupto no MVP. Fade-out (100ms) fica pra polimento futuro se soar seco demais.
- **Behavioral test:** golden test de conversação que simula (via mock): user começa a falar durante `Speaking`, verificar que `audioElement` some do estado antes de 200ms virtualmente.

## Tasks

- [x] **MNT-234** [T][S] ✅ commit `093ba0f` **Frontend: parar `audioRef` no `onCanceled`** — atualizar `useAgentSession.ts` pra que o callback `onCanceled` do `makeTtsDispatcher` chame `audioRef.current?.pause()`, revogue o `objectUrlRef.current` e resete `audioRef.current = null`. Setar status pra `Listening`. Teste em `test/hooks/useAgentSession.spec.tsx` (ou spec dedicado) que dispara `tts.audio.canceled` via mock do WS e checa que o audio element sai do estado + status volta pra Listening. Zero regressão: `onDone` posterior (novo turn) ainda toca normal.

- [ ] **MNT-235** [T][S] **Frontend: drop de chunks pós-cancel (race)** — quando um `tts.audio.delta` chega DEPOIS de um `tts.audio.canceled` do mesmo turn (retardatário do buffer upstream), NÃO acumular. Introduzir flag `activeTurnRef` que vira `false` no cancel e `true` no primeiro delta de um novo turn (delta que chega quando `chunksRef` está vazio E `activeTurnRef` é `false`). Teste: sequência `delta → canceled → delta atrasado → done` não toca o áudio residual.

- [x] **MNT-236** [T][S] ✅ commit `9903750` **UI: feedback visual da interrupção** — quando o cancel roda enquanto o avatar tá em modo Speaking, animação curta (~300ms) no `TalkingAssistantAvatar` sinaliza a interrupção (ex: pulso rápido + fade pro estado Listening). Sem novo componente — só ajusta variantes de motion já existentes no avatar.

- [ ] **MNT-237** [T][P][DEFERRED] **Fade-out em vez de cut abrupto** — se o cut soar seco no uso real, adicionar rampa de gain de 80ms via `GainNode` no path de reprodução. Requer reescrever `playAssembledChunks` pra usar `AudioContext.createBufferSource()` em vez de `<audio>` HTML. Deferrable pra depois do MVP.

- [ ] **MNT-238** [T][S] **Golden test de conversação** — em `test/agent/llm-behavior/` (MNT-95 pattern), cenário: user manda mensagem, assistente começa a responder (mock `tts.audio.delta` chunks), user "fala" antes do fim (evento `input_audio_buffer.speech_started` mockado), asserção: o `AudioElement` do estado é null antes do próximo tick + `AgentSessionStatus === Listening`.

## Sinais de aceite (Definition of Done)

- Áudio do assistente para em ≤200ms depois do início da fala do user (medido em test).
- Status volta pra `Listening` sem passar por `Error`.
- Delta atrasado (pós-cancel) não gera reprodução residual.
- Zero regressão no fluxo normal (assistant fala inteiro sem interrupção).
- Testes verdes: `useAgentSession.spec`, `useAgentSession.utils.spec`, golden behavior test.

## Decisões pendentes (não bloqueia rascunho)

- Fade-out de 80ms vale a complexidade (Audio API vs `<audio>` tag)?
- Se o user fala e imediatamente para (falso positivo do VAD), o assistente deve **retomar** a fala interrompida OU descartar e gerar novo turn? Decisão inicial: descartar (mais simples, alinha com como humanos conversam — quem para, para).
- Barge-in por texto (user digita) também interrompe? Fora do escopo desse spec (canal de texto ainda não implementado).
