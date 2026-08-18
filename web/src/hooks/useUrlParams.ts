/* eslint-disable react-hooks/rules-of-hooks --
 * O lint bane hooks dentro de classe (assume "class component"), mas plain TS
 * class não é componente React. Chamada `urlParamsHooks.use()` acontece durante
 * o render em ordem estável, então Rules of Hooks (runtime) segue respeitada.
 * Regra: `use()` chama todos os hooks no topo em ordem fixa, sem `if`/loop.
 */

"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import type {
  IUrlParamsHooks,
  UrlParamValue,
  UrlParamsHooksResult,
} from "@/hooks/interfaces/useUrlParams.interface";

const applyUpdate = (
  params: URLSearchParams,
  key: string,
  value: UrlParamValue,
): void => {
  params.delete(key);
  if (value === null) return;
  if (Array.isArray(value)) {
    value.forEach((entry) => params.append(key, entry));
    return;
  }
  params.set(key, value);
};

class UrlParamsHooks implements IUrlParamsHooks {
  use(): UrlParamsHooksResult {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const flush = useCallback(
      (params: URLSearchParams) => {
        const query = params.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          scroll: false,
        });
      },
      [pathname, router],
    );

    const cloneParams = useCallback(
      () => new URLSearchParams(searchParams.toString()),
      [searchParams],
    );

    const setParam = useCallback(
      (key: string, value: string | null) => {
        const params = cloneParams();
        applyUpdate(params, key, value);
        flush(params);
      },
      [cloneParams, flush],
    );

    const setListParam = useCallback(
      (key: string, values: string[]) => {
        const params = cloneParams();
        applyUpdate(params, key, values.length > 0 ? values : null);
        flush(params);
      },
      [cloneParams, flush],
    );

    const setParams = useCallback(
      (updates: Record<string, UrlParamValue>) => {
        const params = cloneParams();
        for (const [key, value] of Object.entries(updates)) {
          applyUpdate(params, key, value);
        }
        flush(params);
      },
      [cloneParams, flush],
    );

    return { searchParams, setParam, setListParam, setParams };
  }
}

const urlParamsHooks = new UrlParamsHooks();

export default urlParamsHooks;
