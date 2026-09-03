import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;

  setAuth: (
    user: User,
    token: string,
  ) => void;

  clearAuth: () => void;
}

export const useAuthStore =
  create<AuthState>((set) => ({
    user: null,
    token: null,

    setAuth: (user, token) =>
      set({
        user,
        token,
      }),

    clearAuth: () =>
      set({
        user: null,
        token: null,
      }),
  }));
