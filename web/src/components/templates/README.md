# templates

Esqueletos de layout de página — recebem `children` e definem estrutura
(header, sidebar, footer, spacing). Não devem conter lógica de dados nem
copy fixo específico de uma página.

Exemplos (futuros):
- `AuthLayout` — casca minimalista pras rotas `(auth)/` (login, signup, etc)
- `AppShell` — casca completa pras rotas `(app)/` com nav + topbar

Na prática do Next App Router, muitas vezes o próprio `layout.tsx` de cada
route group **é** o template. Componentes reutilizáveis nascem aqui quando
mais de uma rota precisa do mesmo esqueleto.
