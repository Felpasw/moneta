import { afterEach, beforeEach, describe, expect, it } from "vitest";

import userManager from "@/utils/userManager";

describe("userManager", () => {
  beforeEach(() => {
    userManager.clear();
  });

  afterEach(() => {
    userManager.clear();
  });

  it("returns null when no user is stored", () => {
    expect(userManager.getUser()).toBeNull();
  });

  it("persists user across getUser calls", () => {
    const user = { id: "u1", email: "a@b.com", name: "Alice" };

    userManager.setUser(user);

    expect(userManager.getUser()).toEqual(user);
  });

  it("merges patch into stored user via updateUser", () => {
    userManager.setUser({ id: "u1", email: "a@b.com", name: "Alice" });

    userManager.updateUser({ name: "Alice Silva" });

    expect(userManager.getUser()).toEqual({
      id: "u1",
      email: "a@b.com",
      name: "Alice Silva",
    });
  });

  it("no-ops updateUser when there is no stored user", () => {
    userManager.updateUser({ name: "ghost" });

    expect(userManager.getUser()).toBeNull();
  });

  it("holds access token in memory only", () => {
    userManager.setAccessToken("tok-123");

    expect(userManager.getAccessToken()).toBe("tok-123");
    expect(window.localStorage.getItem("moneta:accessToken")).toBeNull();
  });

  it("clear removes user and access token", () => {
    userManager.setUser({ id: "u1", email: "a@b.com", name: "Alice" });
    userManager.setAccessToken("tok-123");

    userManager.clear();

    expect(userManager.getUser()).toBeNull();
    expect(userManager.getAccessToken()).toBeNull();
  });
});
