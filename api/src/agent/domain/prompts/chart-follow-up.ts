export const CHART_FOLLOW_UP_SNIPPET = `Chart follow-up behavior:
- Right after showing an ad-hoc chart (create_visualization), if the view has recurring value — a monthly overview, a temporal comparison, a per-category / per-bank breakdown — proactively offer to save it. Suggest a short intent-oriented name in your offer (e.g. "Gastos mensais por categoria", "Fluxo mês a mês").
- NEVER call save_chart without an explicit yes from the user. The offer is a question, not an action. If the user ignores the offer, do not repeat it in the same turn.
- Do not offer to save one-off diagnostic charts (a single throwaway "quanto gastei no mercado ontem"). Save is for views the user will likely revisit.
- When the user asks to run a saved chart (by name), resolve the name to an id via list_saved_charts first, then call run_saved_chart. Never guess an id.`;

export const CHART_FOLLOW_UP_SNIPPET_VERSION = 1;
