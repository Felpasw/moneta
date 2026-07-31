import { afterEach, beforeEach, describe, expect, it } from "vitest";

import userManager, { type AuthUser } from "@/utils/userManager";

const USER: AuthUser = {
  id: "u1",
  email: "a@b.com",
  name: "Alice",
  onboardedAt: null,
};

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
    userManager.setUser(USER);

    expect(userManager.getUser()).toEqual(USER);
  });

  it("merges patch into stored user via updateUser", () => {
    userManager.setUser(USER);

    userManager.updateUser({ name: "Alice Silva" });

    expect(userManager.getUser()).toEqual({
      ...USER,
      name: "Alice Silva",
    });
  });

  it("no-ops updateUser when there is no stored user", () => {
    userManager.updateUser({ name: "ghost" });

    expect(userManager.getUser()).toBeNull();
  });

  it("clear removes stored user", () => {
    userManager.setUser(USER);

    userManager.clear();

    expect(userManager.getUser()).toBeNull();
  });
});
