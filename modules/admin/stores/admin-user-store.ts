"use client";

import { create } from "zustand";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
};

type AdminUserStore = {
  user: AdminUser | null;
  setUser: (user: AdminUser) => void;
  clearUser: () => void;
};

export const useAdminUserStore = create<AdminUserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
