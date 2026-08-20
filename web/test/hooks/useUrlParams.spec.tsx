import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replaceMock = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock, push: vi.fn() }),
  usePathname: () => "/transactions",
  useSearchParams: () => currentSearchParams,
}));

import urlParamsHooks from "@/hooks/useUrlParams";

describe("useUrlParams", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    currentSearchParams = new URLSearchParams();
  });

  it("setParam adiciona chave single-value na URL", () => {
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() => result.current.setParam("type", "income"));
    expect(replaceMock).toHaveBeenCalledWith("/transactions?type=income", {
      scroll: false,
    });
  });

  it("setParam com null remove a chave da URL", () => {
    currentSearchParams = new URLSearchParams("type=income&foo=bar");
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() => result.current.setParam("type", null));
    expect(replaceMock).toHaveBeenCalledWith("/transactions?foo=bar", {
      scroll: false,
    });
  });

  it("setParam sem params restantes retorna pathname puro", () => {
    currentSearchParams = new URLSearchParams("type=income");
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() => result.current.setParam("type", null));
    expect(replaceMock).toHaveBeenCalledWith("/transactions", { scroll: false });
  });

  it("setListParam adiciona chave multi-value (repeat)", () => {
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() => result.current.setListParam("accountIds", ["a1", "a2"]));
    expect(replaceMock).toHaveBeenCalledWith(
      "/transactions?accountIds=a1&accountIds=a2",
      { scroll: false },
    );
  });

  it("setListParam com array vazio remove todas as ocorrências da chave", () => {
    currentSearchParams = new URLSearchParams("accountIds=a1&accountIds=a2");
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() => result.current.setListParam("accountIds", []));
    expect(replaceMock).toHaveBeenCalledWith("/transactions", { scroll: false });
  });

  it("setParams aplica batch — string, array e null juntos", () => {
    currentSearchParams = new URLSearchParams("stale=1");
    const { result } = renderHook(() => urlParamsHooks.use());
    act(() =>
      result.current.setParams({
        type: "income",
        accountIds: ["a1", "a2"],
        stale: null,
      }),
    );
    const [url] = replaceMock.mock.calls[0];
    expect(url).toContain("type=income");
    expect(url).toContain("accountIds=a1");
    expect(url).toContain("accountIds=a2");
    expect(url).not.toContain("stale=");
  });
});
