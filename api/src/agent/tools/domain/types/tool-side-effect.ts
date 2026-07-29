export type ToolSideEffect = {
  readonly kind: 'redirect';
  readonly target: string;
};
