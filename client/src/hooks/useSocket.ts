import { useEffect, useRef, useCallback } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function useSocket() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const queryClient = useQueryClient();
  const subscribedListings = useRef<Set<string>>(new Set());

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
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 10,
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected');
        // Re-subscribe to previously subscribed listings
        subscribedListings.current.forEach((id) => {
          socket?.emit('listing:subscribe', id);
        });
      });

      socket.on('listing:updated', (data: {
        listingId: string;
        quantityAvailable: number;
        status: string;
      }) => {
        // Update React Query cache in real time
        queryClient.setQueryData(['listings', data.listingId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            quantityAvailable: data.quantityAvailable,
            status: data.status,
          };
        });
        // Also invalidate nearby listings to refresh the grid
        queryClient.invalidateQueries({ queryKey: ['listings', 'nearby'] });
      });

      socket.on('listing:expired', (data: { listingId: string }) => {
        queryClient.setQueryData(['listings', data.listingId], (old: any) => {
          if (!old) return old;
          return { ...old, status: 'expired' };
        });
        queryClient.invalidateQueries({ queryKey: ['listings', 'nearby'] });
      });

      socket.on('disconnect', (reason) => {
        console.log('[Socket] Disconnected:', reason);
      });

      socket.on('connect_error', (error) => {
        console.error('[Socket] Connection error:', error.message);
      });
    }

    return () => {
      // Don't disconnect on unmount — keep the connection alive
    };
  }, [isAuthenticated, accessToken, queryClient]);

  const subscribeListing = useCallback((listingId: string) => {
    subscribedListings.current.add(listingId);
    socket?.emit('listing:subscribe', listingId);
  }, []);

  const unsubscribeListing = useCallback((listingId: string) => {
    subscribedListings.current.delete(listingId);
    socket?.emit('listing:unsubscribe', listingId);
  }, []);

  return { subscribeListing, unsubscribeListing };
}
