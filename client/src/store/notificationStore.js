import { create } from "zustand";
import { persist } from "zustand/middleware";
const useNotificationStore = create()(
  persist(
    (set, get) => ({
      notifications: [],
      addNotification: (notification) => set((state) => {
        const newNotification = {
          ...notification,
          id: Math.random().toString(36).substring(2, 9),
          read: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        const updatedList = [newNotification, ...state.notifications].slice(0, 50);
        return { notifications: updatedList };
      }),
      markRead: (id) => set((state) => ({
        notifications: state.notifications.map(
          (n) => n.id === id ? { ...n, read: true } : n
        )
      })),
      markAllRead: () => set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true }))
      })),
      clearAll: () => set({ notifications: [] }),
      unreadCount: () => get().notifications.filter((n) => !n.read).length
    }),
    {
      name: "flashyield-notifications"
    }
  )
);
export {
  useNotificationStore
};
