// Field names (nome, cor, fundo, formato, tamanho) mirror the upstream
// PT-BR package shape — renaming them here would break runtime calls.
declare module "@edusites/bancos-brasil" {
  interface BankSvgOptions {
    nome: string;
    cor?: string;
    fundo?: string;
    formato?: "quadrado" | "circulo" | "sem";
    tamanho?: number;
    className?: string;
  }

  export function svgBanco(options: BankSvgOptions): string | null;
  export function listarBancos(): string[];
  export function obterPreset(name: string): Record<string, unknown> | null;
}
