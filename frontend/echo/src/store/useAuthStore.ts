import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    isAuthLoading: boolean;

    setAuth: (user: User, accessToken: string) => void;
    logout: () => void;
    setAuthLoading: (status: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    accessToken: null,
    isAuthLoading: true,

    setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthLoading: false }),

    logout: () =>
        set({ user: null, accessToken: null, isAuthLoading: false }),

    setAuthLoading: (status) =>
        set({ isAuthLoading: status }),
}));