export interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardedAt: string | null;
}

class UserManager {
  private static readonly STORAGE_KEY = "moneta:user";

  private accessToken: string | null = null;

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

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  clearAccessToken(): void {
    this.accessToken = null;
  }

  clear(): void {
    this.clearUser();
    this.clearAccessToken();
  }
}

const userManager = new UserManager();

export default userManager;
