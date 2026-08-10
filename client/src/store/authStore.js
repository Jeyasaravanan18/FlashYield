import { create } from "zustand";
import { persist } from "zustand/middleware";
const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      isAuthModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      setAuth: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false
      }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false
      })
    }),
    {
      name: "food-saver-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
export {
  useAuthStore
};
