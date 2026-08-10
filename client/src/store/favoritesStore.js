import { create } from "zustand";
import { persist } from "zustand/middleware";
const useFavoritesStore = create()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (merchantId) => set((state) => {
        const isFav = state.favorites.includes(merchantId);
        if (isFav) {
          return { favorites: state.favorites.filter((id) => id !== merchantId) };
        } else {
          return { favorites: [...state.favorites, merchantId] };
        }
      }),
      isFavorite: (merchantId) => get().favorites.includes(merchantId)
    }),
    {
      name: "flashyield-favorites"
    }
  )
);
export {
  useFavoritesStore
};
