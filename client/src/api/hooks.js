import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../store/authStore";
function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/auth/login", data);
      return res.data;
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
    }
  });
}
function useGoogleLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async ({ credential, role = "customer", merchantProfile, isLogin }) => (await api.post("/auth/google", { credential, role, merchantProfile, isLogin })).data,
    onSuccess: (data) => setAuth(data.user, data.accessToken)
  });
}
function useRegister() {
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/auth/register", data);
      return res.data;
    }
  });
}
function useVerifyEmail() {
  return useMutation({
    mutationFn: async (data) => (await api.post("/auth/verify-email", data)).data,
    onSuccess: (data) => data
  });
}
function useResendVerification() {
  return useMutation({
    mutationFn: async (data) => (await api.post("/auth/resend-verification", data)).data
  });
}
function useForgotPassword() {
  return useMutation({
    mutationFn: async (data) => (await api.post("/auth/forgot-password", data)).data
  });
}
function useResetPassword() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return useMutation({
    mutationFn: async (data) => (await api.post("/auth/reset-password", data)).data,
    onSuccess: () => {
      clearAuth();
    }
  });
}
function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSettled: () => {
      clearAuth();
      queryClient.clear();
    }
  });
}
function useProfile() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get("/auth/me");
      return res.data;
    },
    enabled: isAuthenticated && !!accessToken
  });
}
function useNearbyListings(params) {
  return useQuery({
    queryKey: ["listings", "nearby", params],
    queryFn: async () => {
      const res = await api.get("/listings/nearby", {
        params: {
          lng: params.lng,
          lat: params.lat,
          radius: params.radius || 5,
          page: params.page || 1,
          limit: 20,
          ...params.category ? { category: params.category } : {},
          ...params.dietaryTags && params.dietaryTags.length > 0 ? { dietaryTags: params.dietaryTags.join(",") } : {}
        }
      });
      return res.data;
    },
    enabled: params.enabled !== false && params.lng !== 0 && params.lat !== 0,
    refetchInterval: 3e4
    // Refresh every 30s
  });
}
function useListingDetail(id) {
  return useQuery({
    queryKey: ["listings", id],
    queryFn: async () => {
      const res = await api.get(`/listings/${id}`);
      return res.data;
    },
    enabled: !!id
  });
}
function useMerchantListings(params) {
  return useQuery({
    queryKey: ["listings", "my", params],
    queryFn: async () => {
      const res = await api.get("/listings/my", { params });
      return res.data;
    }
  });
}
function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/listings", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    }
  });
}
function useCancelListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/listings/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    }
  });
}
function useJoinWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId) => (await api.post(`/waitlist/${listingId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waitlist"] })
  });
}
function useLeaveWaitlist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listingId) => (await api.delete(`/waitlist/${listingId}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["waitlist"] })
  });
}
function useMyWaitlist() {
  return useQuery({
    queryKey: ["waitlist", "my"],
    queryFn: async () => (await api.get("/waitlist/my/all")).data
  });
}
function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, quantity = 1 }) => {
      const res = await api.post("/claims", { listingId, quantity }, {
        headers: {
          "X-Idempotency-Key": `${listingId}-${quantity}-${Date.now()}-${Math.random().toString(36).slice(2)}`
        }
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    }
  });
}
function useMyClaims(params) {
  return useQuery({
    queryKey: ["claims", "my", params],
    queryFn: async () => {
      const res = await api.get("/claims/my", { params });
      return res.data;
    },
    enabled: params?.enabled !== false
  });
}
function useCancelClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.delete(`/claims/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    }
  });
}
function useVerifyToken() {
  return useMutation({
    mutationFn: async (token) => {
      const res = await api.post("/claims/verify", { token });
      return res.data;
    }
  });
}
function useMerchantProfile() {
  return useQuery({
    queryKey: ["merchant", "profile"],
    queryFn: async () => {
      const res = await api.get("/merchants/profile");
      return res.data;
    }
  });
}
function useCreateMerchantProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/merchants/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
    }
  });
}
function useMerchantDashboard() {
  return useQuery({
    queryKey: ["merchant", "dashboard"],
    queryFn: async () => {
      const res = await api.get("/merchants/dashboard");
      return res.data;
    },
    refetchInterval: 6e4
  });
}
function useAdminMerchants(params) {
  return useQuery({
    queryKey: ["admin", "merchants", params],
    queryFn: async () => {
      const res = await api.get("/admin/merchants", { params });
      return res.data;
    }
  });
}
function useUpdateMerchantStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.put(`/admin/merchants/${data.id}/status`, {
        status: data.status,
        reason: data.reason
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "merchants"] });
    }
  });
}
function useAuditLogs(params) {
  return useQuery({
    queryKey: ["admin", "audit-logs", params],
    queryFn: async () => {
      const res = await api.get("/admin/audit-logs", { params });
      return res.data;
    }
  });
}
function useImpactStats() {
  return useQuery({
    queryKey: ["stats", "impact"],
    queryFn: async () => {
      const res = await api.get("/stats/impact");
      return res.data;
    },
    refetchInterval: 3e4,
    // Refresh every 30s
    staleTime: 1e4
  });
}
function useMerchantReviews(merchantId, params) {
  return useQuery({
    queryKey: ["reviews", merchantId, params],
    queryFn: async () => {
      const res = await api.get(`/reviews/merchant/${merchantId}`, { params });
      return res.data;
    },
    enabled: !!merchantId
  });
}
function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post("/reviews", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    }
  });
}
function useCustomerAnalytics(params) {
  return useQuery({
    queryKey: ["analytics", "customer"],
    queryFn: async () => {
      const res = await api.get("/analytics/customer");
      return res.data;
    },
    enabled: params?.enabled !== false
  });
}
function useMerchantAnalytics() {
  return useQuery({
    queryKey: ["analytics", "merchant"],
    queryFn: async () => {
      const res = await api.get("/analytics/merchant");
      return res.data;
    }
  });
}
function useMerchantTemplates() {
  return useQuery({
    queryKey: ["merchant", "templates"],
    queryFn: async () => (await api.get("/merchants/features/templates")).data
  });
}
function usePricingSuggestion(params) {
  return useQuery({
    queryKey: ["merchant", "pricing-suggestion", params],
    queryFn: async () => (await api.get("/merchants/features/pricing-suggestion", { params })).data,
    enabled: !!params
  });
}
function useDuplicateLastListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => (await api.post("/merchants/features/duplicate-last")).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
    }
  });
}
function useMerchantQueue() {
  return useQuery({
    queryKey: ["merchant", "queue"],
    queryFn: async () => (await api.get("/merchants/features/queue")).data,
    refetchInterval: 30000
  });
}
function useMerchantNotifications() {
  return useQuery({
    queryKey: ["merchant", "notifications"],
    queryFn: async () => (await api.get("/merchants/features/notifications")).data
  });
}
function useMerchantHandoffLog() {
  return useQuery({
    queryKey: ["merchant", "handoff-log"],
    queryFn: async () => (await api.get("/merchants/features/handoff-log")).data
  });
}
function useCreateHandoffLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/merchants/features/handoff-log", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "handoff-log"] })
  });
}
function useMerchantExports() {
  return useQuery({
    queryKey: ["merchant", "exports"],
    queryFn: async () => (await api.get("/merchants/features/exports")).data
  });
}
function useMerchantProfileTools() {
  return useQuery({
    queryKey: ["merchant", "profile-tools"],
    queryFn: async () => (await api.get("/merchants/features/profile-tools")).data
  });
}
function useBatchPreview() {
  return useMutation({
    mutationFn: async (items) => (await api.post("/merchants/features/batch-preview", { items })).data
  });
}
function useCameraSuggest() {
  return useMutation({
    mutationFn: async () => (await api.post("/merchants/features/camera-suggest")).data
  });
}
function useMerchantSchedule() {
  return useQuery({
    queryKey: ["merchant", "schedule"],
    queryFn: async () => (await api.get("/merchants/features/schedule")).data,
    refetchInterval: 30000
  });
}
function useCharts() {
  return useQuery({
    queryKey: ["merchant", "charts"],
    queryFn: async () => (await api.get("/merchants/features/charts")).data,
    refetchInterval: 60000
  });
}
function useMerchantNoShows() {
  return useQuery({
    queryKey: ["merchant", "no-shows"],
    queryFn: async () => (await api.get("/merchants/features/no-shows")).data
  });
}
function useInventoryForecast() {
  return useQuery({
    queryKey: ["merchant", "forecast"],
    queryFn: async () => (await api.get("/merchants/features/forecast")).data,
    refetchInterval: 60000
  });
}
function useBatchCreateListings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items) => (await api.post("/merchants/features/batch-create", { items })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
    }
  });
}
function useUpdatePromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/merchants/features/listings/${data.id}/promotion`, { promotionMode: data.promotionMode })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listings"] })
  });
}
function usePromotionTargeting() {
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/merchants/features/listings/${data.id}/promotion`, { promotionMode: data.promotionMode })).data
  });
}
function useForecast() {
  return useQuery({
    queryKey: ["merchant", "forecast"],
    queryFn: async () => (await api.get("/merchants/features/forecast")).data,
    refetchInterval: 60000
  });
}
function useBatchUpload() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (items) => (await api.post("/listings/batch", { items })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["merchant"] });
    }
  });
}
function useVerifyQueueClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/merchants/features/queue/${id}/verify`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "queue"] })
  });
}
function useNoShowQueueClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.post(`/merchants/features/queue/${id}/no-show`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant", "queue"] });
      queryClient.invalidateQueries({ queryKey: ["merchant", "no-shows"] });
    }
  });
}
function useUpdateNoShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/merchants/features/no-shows/${data.customerId}`, { count: data.count })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "no-shows"] })
  });
}
function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/merchants/features/schedule/${data.id}`, { scheduledPublishAt: data.scheduledPublishAt })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "schedule"] })
  });
}
function useCancelSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/merchants/features/schedule/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "schedule"] })
  });
}
function useUpdateProfileTools() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch("/merchants/features/profile-tools", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "profile-tools"] })
  });
}
function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.post("/merchants/features/templates", data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "templates"] })
  });
}
function useUpdateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => (await api.patch(`/merchants/features/templates/${data.id}`, data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "templates"] })
  });
}
function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => (await api.delete(`/merchants/features/templates/${id}`)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["merchant", "templates"] })
  });
}
function useChatAssistant() {
  return useMutation({
    mutationFn: async (message) => (await api.post("/merchants/features/chat", { message })).data
  });
}
function useUploadImage() {
  return useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post("/upload/image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return res.data;
    }
  });
}

function useUpdateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.put(`/listings/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    }
  });
}
export {
  useAdminMerchants,
  useAuditLogs,
  useCancelClaim,
  useCancelListing,
  useCreateClaim,
  useCreateListing,
  useCreateMerchantProfile,
  useCustomerAnalytics,
  useGoogleLogin,
  useImpactStats,
  useJoinWaitlist,
  useLeaveWaitlist,
  useListingDetail,
  useLogin,
  useLogout,
  useMerchantAnalytics,
  useMerchantDashboard,
  useMerchantListings,
  useMerchantProfile,
  useMerchantReviews,
  useMerchantTemplates,
  usePricingSuggestion,
  useDuplicateLastListing,
  useMerchantQueue,
  useMerchantNotifications,
  useMerchantHandoffLog,
  useCreateHandoffLog,
  useMerchantExports,
  useMerchantProfileTools,
  useMerchantSchedule,
  useCharts,
  useMerchantNoShows,
  useInventoryForecast,
  useForecast,
  useBatchCreateListings,
  useBatchUpload,
  useUpdatePromotion,
  usePromotionTargeting,
  useVerifyQueueClaim,
  useNoShowQueueClaim,
  useUpdateNoShow,
  useUpdateSchedule,
  useCancelSchedule,
  useUpdateProfileTools,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useChatAssistant,
  useBatchPreview,
  useCameraSuggest,
  useMyClaims,
  useMyWaitlist,
  useNearbyListings,
  useProfile,
  useForgotPassword,
  useRegister,
  useResetPassword,
  useResendVerification,
  useVerifyEmail,
  useSubmitReview,
  useUpdateMerchantStatus,
  useUpdateListing,
  useVerifyToken,
  useUploadImage
};
