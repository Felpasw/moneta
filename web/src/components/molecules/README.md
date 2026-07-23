# molecules

Composições **pequenas** de atoms. Uma molecule tem responsabilidade única e
não conhece contexto de página nem faz side-effects globais (nem chama API,
nem lê router).

Exemplos:
- `PasswordStrengthMeter` — `Input` + `Meter` calculando força de senha
- `FormField` (futuro) — `Label` + `Input` + mensagem de erro

Se o componente **compõe outras molecules** ou **coordena estado remoto**,
sobe pra `organisms/`.
