import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardedAt: string | null;
}

interface UserState {
  user: AuthUser | null;
}

const INITIAL_STATE: UserState = {
  user: null,
};

export const useUserStore = create<UserState>()(
  persist(() => INITIAL_STATE, {
    name: "moneta:user-store",
  }),
);

export const userStoreActions = {
  setUser: (user: AuthUser) => useUserStore.setState({ user }),
  updateUser: (patch: Partial<AuthUser>) => {
    const current = useUserStore.getState().user;
    if (current === null) return;
    useUserStore.setState({ user: { ...current, ...patch } });
  },
  clear: () => useUserStore.setState({ user: null }),
} as const;
