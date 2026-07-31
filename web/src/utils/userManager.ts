export interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardedAt: string | null;
}

class UserManager {
  private static readonly STORAGE_KEY = "moneta:user";

  getUser(): AuthUser | null {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(UserManager.STORAGE_KEY);
    if (raw === null) return null;

    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      window.localStorage.removeItem(UserManager.STORAGE_KEY);
      return null;
    }
  }

  setUser(user: AuthUser): void {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(UserManager.STORAGE_KEY, JSON.stringify(user));
  }

  updateUser(patch: Partial<AuthUser>): void {
    const current = this.getUser();
    if (current === null) return;
    this.setUser({ ...current, ...patch });
  }

  clearUser(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(UserManager.STORAGE_KEY);
  }

  clear(): void {
    this.clearUser();
  }
}

const userManager = new UserManager();

export default userManager;
