import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../store/authStore";
import { useNotificationStore } from "../store/notificationStore";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:3001";
let socket = null;
function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const subscribedListings = useRef(/* @__PURE__ */ new Set());
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }
    if (!socket || !socket.connected) {
      socket = io(SOCKET_URL, {
        auth: { token: accessToken },
        reconnection: true,
        reconnectionDelay: 1e3,
        reconnectionDelayMax: 1e4,
        reconnectionAttempts: 10
      });
      socket.on("connect", () => {
        console.log("[Socket] Connected");
        subscribedListings.current.forEach((id) => {
          socket?.emit("listing:subscribe", id);
        });
      });
      socket.on("listing:updated", (data) => {
        queryClient.setQueryData(["listings", data.listingId], (old) => {
          if (!old) return old;
          if (data.quantityAvailable < old.quantityAvailable) {
            useNotificationStore.getState().addNotification({
              title: "Bundle Claimed",
              message: `A bundle was claimed for ${old.title}. ${data.quantityAvailable} left!`,
              type: "info"
            });
          }
          if (data.status === "sold_out" && old.status !== "sold_out") {
            useNotificationStore.getState().addNotification({
              title: "Sold Out",
              message: `${old.title} has completely sold out!`,
              type: "warning"
            });
          }
          return {
            ...old,
            quantityAvailable: data.quantityAvailable,
            status: data.status
          };
        });
        queryClient.invalidateQueries({ queryKey: ["listings", "nearby"] });
      });
      socket.on("listing:expired", (data) => {
        queryClient.setQueryData(["listings", data.listingId], (old) => {
          if (!old) return old;
          if (old.status !== "expired") {
            useNotificationStore.getState().addNotification({
              title: "Listing Expired",
              message: `The claim window for ${old.title} has closed.`,
              type: "info"
            });
          }
          return { ...old, status: "expired" };
        });
        queryClient.invalidateQueries({ queryKey: ["listings", "nearby"] });
      });
      socket.on("disconnect", (reason) => {
        console.log("[Socket] Disconnected:", reason);
      });
      socket.on("connect_error", (error) => {
        console.error("[Socket] Connection error:", error.message);
      });
    }
    return () => {
    };
  }, [isAuthenticated, accessToken, queryClient]);
  const subscribeListing = useCallback((listingId) => {
    subscribedListings.current.add(listingId);
    socket?.emit("listing:subscribe", listingId);
  }, []);
  const unsubscribeListing = useCallback((listingId) => {
    subscribedListings.current.delete(listingId);
    socket?.emit("listing:unsubscribe", listingId);
  }, []);
  return { subscribeListing, unsubscribeListing };
}
export {
  useSocket
};
