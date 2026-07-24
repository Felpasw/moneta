export interface UseBankIconOptions {
  bankName: string;
  size: number;
}

export type UseBankIconState =
  | { kind: "fallback" }
  | { kind: "svg"; markup: string };
