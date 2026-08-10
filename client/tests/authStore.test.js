import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "../src/store/authStore";
describe("Auth Store", () => {
  beforeEach(() => {
    const store = useAuthStore.getState();
    store.clearAuth();
  });
  it("should have initial state", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
  it("should set auth correctly", () => {
    const store = useAuthStore.getState();
    const mockUser = {
      id: "123",
      email: "test@example.com",
      role: "customer",
      emailVerified: true
    };
    store.setAuth(mockUser, "mock-token");
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe("mock-token");
    expect(state.isAuthenticated).toBe(true);
  });
  it("should clear auth correctly", () => {
    const store = useAuthStore.getState();
    store.setAuth(
      { id: "1", email: "a@a.com", role: "customer", emailVerified: true },
      "token"
    );
    store.clearAuth();
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
