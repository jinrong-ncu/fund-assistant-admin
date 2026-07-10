import { create } from 'zustand';
import { AdminUser } from '../types';

type AuthStore = {
  admin: AdminUser | null;
  setAdmin: (admin: AdminUser | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  admin: null,
  setAdmin: (admin) => set({ admin }),
}));
