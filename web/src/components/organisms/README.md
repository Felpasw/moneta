# organisms

Composições **grandes** que combinam molecules e atoms, geralmente com estado
próprio ou consumindo hooks de dados remotos.

Exemplos (futuros):
- `LoginForm` — form completo consumindo `useLogin`
- `Sidebar` — navegação lateral do app shell
- `TransactionList` — lista virtualizada consumindo `useTransactions`

Um organism é a menor unidade que **conhece o domínio** (auth, transações,
faturas). Se ainda é agnóstico, provavelmente é molecule.
