import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useGoogleLogin, useLogin, useRegister } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Loader2, Leaf, X, Store, ShoppingBag } from "lucide-react";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [merchantDetails, setMerchantDetails] = useState({
    businessName: "",
    phone: "",
    address: "",
    description: ""
  });
  const [error, setError] = useState("");

  const login = useLogin();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (mode === "login") {
      login.mutate(
        { email, password, role: "customer" },
        {
          onSuccess: (data) => {
            closeAuthModal();
            const userRole = data.user.role;
            if (userRole === "merchant") navigate("/merchant");
            else if (userRole === "admin") navigate("/admin");
          },
          onError: (err) => setError(getErrorMessage(err))
        }
      );
    } else {
      const merchantProfile = role === "merchant" ? merchantDetails : undefined;
      register.mutate(
        { email, password, role, merchantProfile },
        {
          onSuccess: () => {
            closeAuthModal();
            navigate("/verify-email", { state: { email, role } });
          },
          onError: (err) => setError(getErrorMessage(err))
        }
      );
    }
  };

  const handleDismiss = () => {
    closeAuthModal();
    setTimeout(() => {
      setMode("login");
      setEmail("");
      setPassword("");
      setRole("customer");
      setMerchantDetails({
        businessName: "",
        phone: "",
        address: "",
        description: ""
      });
      setError("");
    }, 200);
  };

  const isPending = login.isPending || register.isPending || googleLogin.isPending;

  const handleGoogleLogin = (credential) => {
    setError("");
    if (
      mode === "register" &&
      role === "merchant" &&
      (!merchantDetails.businessName.trim() || !merchantDetails.phone.trim() || !merchantDetails.address.trim())
    ) {
      setError("Enter store name, phone, and pickup address before continuing with Google.");
      return;
    }

    googleLogin.mutate(
      {
        credential,
        role: mode === "register" ? role : "customer",
        merchantProfile: mode === "register" && role === "merchant" ? merchantDetails : undefined,
        isLogin: mode === "login"
      },
      {
        onSuccess: (data) => {
          closeAuthModal();
          if (data.user.role === "merchant") navigate("/merchant");
          else if (data.user.role === "admin") navigate("/admin");
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />
      
      <div className="relative max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scale-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-surface-900">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-1 text-sm text-surface-400">
            {mode === "login" ? "Sign in to claim bundles" : "Join to save money and reduce waste"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="label">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="label">
              Password
            </label>
            <input
              id="auth-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === "login" ? "Enter your password" : "Use 8+ chars with A-z and number"}
              required
              minLength={8}
            />
          </div>

          {mode === "register" && (
            <div>
              <label className="label">Account type</label>
              <div className="grid grid-cols-2 gap-3 mt-1.5">
                <button
                  type="button"
                  onClick={() => setRole("customer")}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === "customer"
                      ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10"
                      : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  Buy food
                </button>
                <button
                  type="button"
                  onClick={() => setRole("merchant")}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${
                    role === "merchant"
                      ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10"
                      : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"
                  }`}
                >
                  <Store className="w-4 h-4" />
                  Sell food
                </button>
              </div>
            </div>
          )}

          {mode === "register" && role === "merchant" && (
            <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-brand-600">
                <Store className="w-4 h-4" />
                Merchant details
              </div>
              
              <div>
                <label htmlFor="merchant-business-name" className="label">
                  Store / business name
                </label>
                <input
                  id="merchant-business-name"
                  type="text"
                  className="input"
                  value={merchantDetails.businessName}
                  onChange={(e) =>
                    setMerchantDetails((current) => ({ ...current, businessName: e.target.value }))
                  }
                  placeholder="Jeya Sweets"
                  required
                />
              </div>

              <div>
                <label htmlFor="merchant-phone" className="label">
                  Store phone
                </label>
                <input
                  id="merchant-phone"
                  type="tel"
                  className="input"
                  value={merchantDetails.phone}
                  onChange={(e) =>
                    setMerchantDetails((current) => ({ ...current, phone: e.target.value }))
                  }
                  placeholder="9876543210"
                  required
                />
              </div>

              <div>
                <label htmlFor="merchant-address" className="label">
                  Pickup address
                </label>
                <textarea
                  id="merchant-address"
                  className="input min-h-20 resize-none"
                  value={merchantDetails.address}
                  onChange={(e) =>
                    setMerchantDetails((current) => ({ ...current, address: e.target.value }))
                  }
                  placeholder="Street, area, city, pincode"
                  required
                />
              </div>

              <div>
                <label htmlFor="merchant-description" className="label">
                  Store note
                </label>
                <textarea
                  id="merchant-description"
                  className="input min-h-20 resize-none"
                  value={merchantDetails.description}
                  onChange={(e) =>
                    setMerchantDetails((current) => ({ ...current, description: e.target.value }))
                  }
                  placeholder="Bakery, cafe, restaurant, home kitchen..."
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary w-full py-3.5 mt-2"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {mode === "login" ? "Signing in..." : "Creating account..."}
              </span>
            ) : mode === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <>
          <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-surface-400">
            <span className="h-px flex-1 bg-surface-200" />
            or
            <span className="h-px flex-1 bg-surface-200" />
          </div>

          <GoogleSignInButton
            onCredential={handleGoogleLogin}
            disabled={isPending}
            selectedRole={mode === "register" ? role : "customer"}
            onRoleChange={mode === "register" ? setRole : undefined}
            showRoleSelector={false}
          />
        </>

        <p className="text-center mt-5 text-sm text-surface-400">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
          >
            {mode === "login" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
