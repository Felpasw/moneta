import { describe, expect, it } from "vitest";

import { queryClient } from "./queryClient";

describe("queryClient", () => {
  const queryRetry = queryClient.getDefaultOptions().queries?.retry;
  const mutationRetry = queryClient.getDefaultOptions().mutations?.retry;

  it("does not retry queries on 4xx (except 408)", () => {
    if (typeof queryRetry !== "function") {
      throw new Error("expected queryRetry to be a function");
    }

    expect(queryRetry(0, { response: { status: 401 } })).toBe(false);
    expect(queryRetry(0, { response: { status: 404 } })).toBe(false);
    expect(queryRetry(0, { response: { status: 408 } })).toBe(true);
  });

  it("retries queries on 5xx up to 3 times", () => {
    if (typeof queryRetry !== "function") {
      throw new Error("expected queryRetry to be a function");
    }

    expect(queryRetry(0, { response: { status: 500 } })).toBe(true);
    expect(queryRetry(2, { response: { status: 500 } })).toBe(true);
    expect(queryRetry(3, { response: { status: 500 } })).toBe(false);
  });

  it("does not retry mutations on 4xx", () => {
    if (typeof mutationRetry !== "function") {
      throw new Error("expected mutationRetry to be a function");
    }

    expect(mutationRetry(0, { response: { status: 400 } })).toBe(false);
    expect(mutationRetry(0, { response: { status: 500 } })).toBe(true);
    expect(mutationRetry(1, { response: { status: 500 } })).toBe(false);
  });
});
