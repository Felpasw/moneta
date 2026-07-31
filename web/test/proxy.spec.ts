import { NextRequest } from "next/server";
import { getRedirectUrl } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { proxy } from "@/proxy";

const BASE_URL = "http://localhost";

interface BuildRequestOptions {
  readonly hasAccessCookie?: boolean;
}

const buildRequest = (
  path: string,
  options: BuildRequestOptions = {},
): NextRequest => {
  const headers = new Headers();
  if (options.hasAccessCookie) {
    headers.set("cookie", "access_token=jwt.value.here");
  }
  return new NextRequest(new URL(path, BASE_URL).toString(), { headers });
};

describe("proxy", () => {
  describe("rotas públicas", () => {
    it.each(["/", "/login", "/signup"])(
      "não redireciona quando pathname=%s (sem cookie)",
      (path) => {
        const response = proxy(buildRequest(path));
        expect(getRedirectUrl(response)).toBeNull();
      },
    );
  });

  describe("rotas protegidas sem cookie access_token", () => {
    it.each(["/dashboard", "/settings/assistant", "/onboarding"])(
      "redireciona pra / quando pathname=%s",
      (path) => {
        const response = proxy(buildRequest(path));
        const redirectUrl = getRedirectUrl(response);
        expect(redirectUrl).not.toBeNull();
        expect(new URL(redirectUrl as string).pathname).toBe("/");
      },
    );
  });

  describe("rotas protegidas com cookie access_token", () => {
    it.each(["/dashboard", "/settings/assistant", "/onboarding"])(
      "não redireciona quando pathname=%s",
      (path) => {
        const response = proxy(
          buildRequest(path, { hasAccessCookie: true }),
        );
        expect(getRedirectUrl(response)).toBeNull();
      },
    );
  });
});
