import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore, type User } from '../store/authStore';

// ── Auth Hooks ──

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  role: 'customer' | 'merchant';
}

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await api.post('/auth/login', data);
      return res.data as { user: User; accessToken: string };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: RegisterInput) => {
      const res = await api.post('/auth/register', data);
      return res.data as { user: User; accessToken: string };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post('/auth/logout');
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    },
  });
}

export function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
    enabled: isAuthenticated,
  });
}

// ── Listings Hooks ──

export interface Listing {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  dietaryTags?: string[];
  originalPrice: number;
  discountedPrice: number;
  quantityTotal: number;
  quantityAvailable: number;
  claimWindowStart: string;
  claimWindowEnd: string;
  status: string;
  createdAt: string;
  discountPercentage?: number;
  distance?: number;
  merchant?: {
    _id: string;
    businessName: string;
    address: string;
    location: { type: string; coordinates: [number, number] };
    imageUrl?: string;
  };
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useNearbyListings(params: {
  lng: number;
  lat: number;
  radius?: number;
  page?: number;
  category?: string;
  dietaryTags?: string[];
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['listings', 'nearby', params],
    queryFn: async () => {
      const res = await api.get('/listings/nearby', {
        params: {
          lng: params.lng,
          lat: params.lat,
          radius: params.radius || 5,
          page: params.page || 1,
          limit: 20,
          ...(params.category ? { category: params.category } : {}),
          ...(params.dietaryTags && params.dietaryTags.length > 0 ? { dietaryTags: params.dietaryTags.join(',') } : {}),
        },
      });
      return res.data as PaginatedResponse<Listing>;
    },
    enabled: params.enabled !== false && params.lng !== 0 && params.lat !== 0,
    refetchInterval: 30000, // Refresh every 30s
  });
}

export function useListingDetail(id: string) {
  return useQuery({
    queryKey: ['listings', id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data as Listing;
    },
    enabled: !!id,
  });
}

export function useMerchantListings(params?: { page?: number; status?: string }) {
  return useQuery({
    queryKey: ['listings', 'my', params],
    queryFn: async () => {
      const res = await api.get('/listings/my', { params });
      return res.data as PaginatedResponse<Listing>;
    },
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      imageUrl: string;
      category: string;
      dietaryTags?: string[];
      originalPrice: number;
      discountedPrice: number;
      quantityTotal: number;
      claimWindowStart: string;
      claimWindowEnd: string;
    }) => {
      const res = await api.post('/listings', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useCancelListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

// ── Claims Hooks ──

export interface Claim {
  _id: string;
  listingId: Listing | string;
  customerId: string;
  token: string;
  status: string;
  claimedAt: string;
  collectedAt: string | null;
  expiresAt: string;
}

export function useCreateClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const res = await api.post('/claims', { listingId }, {
        headers: {
          'X-Idempotency-Key': `${listingId}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      });
      return res.data as { claim: Claim; token: string; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
    },
  });
}

export function useMyClaims(params?: { page?: number; status?: string; enabled?: boolean }) {
  return useQuery({
    queryKey: ['claims', 'my', params],
    queryFn: async () => {
      const res = await api.get('/claims/my', { params });
      return res.data as PaginatedResponse<Claim>;
    },
    enabled: params?.enabled !== false,
  });
}

export function useCancelClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/claims/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      queryClient.invalidateQueries({ queryKey: ['listings'] });
    },
  });
}

export function useVerifyToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const res = await api.post('/claims/verify', { token });
      return res.data as { message: string; claim: Claim };
    },
  });
}

// ── Merchant Hooks ──

export interface MerchantProfile {
  _id: string;
  userId: string | { email: string };
  businessName: string;
  description: string;
  address: string;
  location: { type: string; coordinates: [number, number] };
  phone: string;
  imageUrl: string | null;
  verificationStatus: string;
  operatingHours: Array<{ day: string; open: string; close: string }>;
}

export function useMerchantProfile() {
  return useQuery({
    queryKey: ['merchant', 'profile'],
    queryFn: async () => {
      const res = await api.get('/merchants/profile');
      return res.data as MerchantProfile;
    },
  });
}

export function useCreateMerchantProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      businessName: string;
      description?: string;
      address: string;
      phone: string;
    }) => {
      const res = await api.post('/merchants/profile', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
    },
  });
}

export function useMerchantDashboard() {
  return useQuery({
    queryKey: ['merchant', 'dashboard'],
    queryFn: async () => {
      const res = await api.get('/merchants/dashboard');
      return res.data as {
        profile: MerchantProfile;
        stats: {
          activeListings: number;
          totalListings: number;
          todayClaims: number;
          totalClaims: number;
          collectedClaims: number;
          collectionRate: number;
        };
      };
    },
    refetchInterval: 60000,
  });
}

// ── Admin Hooks ──

export function useAdminMerchants(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'merchants', params],
    queryFn: async () => {
      const res = await api.get('/admin/merchants', { params });
      return res.data as PaginatedResponse<MerchantProfile>;
    },
  });
}

export function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; status: 'approved' | 'suspended'; reason?: string }) => {
      const res = await api.put(`/admin/merchants/${data.id}/status`, {
        status: data.status,
        reason: data.reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'merchants'] });
    },
  });
}

export function useAuditLogs(params?: { action?: string; page?: number }) {
  return useQuery({
    queryKey: ['admin', 'audit-logs', params],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', { params });
      return res.data;
    },
  });
}

// ── Stats Hooks ──

export interface ImpactStats {
  mealsRescued: number;
  activeBundles: number;
  merchantCount: number;
  totalSaved: number;
}

export function useImpactStats() {
  return useQuery({
    queryKey: ['stats', 'impact'],
    queryFn: async () => {
      const res = await api.get('/stats/impact');
      return res.data as ImpactStats;
    },
    refetchInterval: 30000, // Refresh every 30s
    staleTime: 10000,
  });
}
