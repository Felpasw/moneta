"use client";

import { svgBanco } from "@edusites/bancos-brasil";
import { useQuery } from "@tanstack/react-query";

import type {
  UseBankIconOptions,
  UseBankIconState,
} from "@/hooks/interfaces/useBankIcon.interface";
import { resolveBankIconSlug } from "@/utils/bankIconSlug";

export function useBankIcon({
  bankName,
  size,
}: UseBankIconOptions): UseBankIconState {
  const slug = resolveBankIconSlug(bankName);
  const { data: svg, isError } = useQuery({
    queryKey: ["bank-svg", slug, size],
    queryFn: () => svgBanco({ nome: slug ?? "", tamanho: size }),
    enabled: slug !== null,
    staleTime: Infinity,
    retry: false,
  });

  if (!slug || isError || !svg) return { kind: "fallback" };
  return { kind: "svg", markup: svg };
}
