import type { ReadonlyURLSearchParams } from "next/navigation";

export type UrlParamValue = string | string[] | null;

export interface UrlParamsHooksResult {
  searchParams: ReadonlyURLSearchParams;
  setParam: (key: string, value: string | null) => void;
  setListParam: (key: string, values: string[]) => void;
  setParams: (updates: Record<string, UrlParamValue>) => void;
}

export interface IUrlParamsHooks {
  use(): UrlParamsHooksResult;
}
