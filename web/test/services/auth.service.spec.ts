import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import api from "@/api";

import authService from "@/services/auth.service";

vi.mock("@/api", () => ({
  default: {
    post: vi.fn(),
  },
}));

const mockedPost = vi.mocked(api.post);

describe("authService", () => {
  beforeEach(() => {
    mockedPost.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("login", () => {
    it("POSTs credentials to /auth/login and returns the payload", async () => {
      const payload = {
        user: { id: "u1", email: "a@b.com", name: "Alice" },
        accessToken: "acc-1",
        refreshToken: "ref-1",
      };
      mockedPost.mockResolvedValueOnce({ data: payload });

      const result = await authService.login({
        email: "a@b.com",
        password: "hunter22",
      });

      expect(mockedPost).toHaveBeenCalledWith("/auth/login", {
        email: "a@b.com",
        password: "hunter22",
      });
      expect(result).toEqual(payload);
    });

    it("propaga o erro do axios", async () => {
      const error = { response: { status: 401, data: { message: "Invalid credentials" } } };
      mockedPost.mockRejectedValueOnce(error);

      await expect(
        authService.login({ email: "x@y.com", password: "wrong" }),
      ).rejects.toBe(error);
    });
  });

  describe("signup", () => {
    it("POSTs data to /auth/signup e retorna user", async () => {
      const payload = { user: { id: "u1", email: "a@b.com", name: "Alice" } };
      mockedPost.mockResolvedValueOnce({ data: payload });

      const result = await authService.signup({
        email: "a@b.com",
        password: "hunter22",
        name: "Alice",
      });

      expect(mockedPost).toHaveBeenCalledWith("/auth/signup", {
        email: "a@b.com",
        password: "hunter22",
        name: "Alice",
      });
      expect(result).toEqual(payload);
    });
  });

  describe("logout", () => {
    it("POSTs vazio pra /auth/logout", async () => {
      mockedPost.mockResolvedValueOnce({ data: undefined, status: 204 });

      await authService.logout();

      expect(mockedPost).toHaveBeenCalledWith("/auth/logout", {});
    });
  });

  describe("refresh", () => {
    it("POSTs vazio pra /auth/refresh e retorna novos tokens", async () => {
      const payload = {
        user: { id: "u1", email: "a@b.com", name: "Alice" },
        accessToken: "acc-2",
        refreshToken: "ref-2",
      };
      mockedPost.mockResolvedValueOnce({ data: payload });

      const result = await authService.refresh();

      expect(mockedPost).toHaveBeenCalledWith("/auth/refresh", {});
      expect(result).toEqual(payload);
    });
  });
});
