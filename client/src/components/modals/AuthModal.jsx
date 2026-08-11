import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useGoogleLogin, useLogin, useRegister, useResendVerification } from "../../api/hooks";
import { api, getErrorMessage } from "../../lib/api";
import { Loader2, Leaf, X, Store, ShoppingBag } from "lucide-react";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";

const strongPasswordMessage = "Use 8+ characters with uppercase, lowercase, and a number.";
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

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
  const [showResend, setShowResend] = useState(false);

  const login = useLogin();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const resendVerification = useResendVerification();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShowResend(false);

    if (mode === "login") {
      login.mutate(
        { email, password },
        {
          onSuccess: (data) => {
            closeAuthModal();
            const userRole = data.user.role;
            if (userRole === "merchant") navigate("/merchant");
            else if (userRole === "admin") navigate("/admin");
          },
          onError: (err) => {
            const message = getErrorMessage(err);
            setError(message);
            if (message.toLowerCase().includes("verify your email") || message.toLowerCase().includes("verification")) {
              setShowResend(true);
            }
          }
        }
      );
    } else {
      if (!isStrongPassword(password)) {
        setError(strongPasswordMessage);
        return;
      }
      const merchantProfile = role === "merchant" ? merchantDetails : undefined;
      register.mutate(
        { email, password, role, merchantProfile },
        {
          onSuccess: (data) => {
            closeAuthModal();
            navigate("/verify-email", { state: { email, role, message: data.message, emailSent: data.emailSent } });
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
      setShowResend(false);
    }, 200);
  };

  const isPending = login.isPending || register.isPending || googleLogin.isPending;

  const handleGoogleLogin = (credential) => {
    setError("");
    setShowResend(false);

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
        role: mode === "register" ? role : undefined,
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
      
      <div className="relative max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl max-w-[440px] w-full p-8 sm:p-10 animate-scale-in">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center mb-8">
          <div className="mb-4 flex items-center justify-center">
            <span className="text-3xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight uppercase">
              FlashYield
            </span>
          </div>
          <h2 className="text-2xl font-normal tracking-tight text-surface-900 sm:text-3xl text-center">
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-2 text-sm text-surface-500 text-center max-w-xs">
            {mode === "login" 
              ? "Sign in to claim local surplus bundles." 
              : "Rescue fresh food. Sell surplus faster."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {showResend && mode === "login" && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 font-medium flex items-center justify-between gap-2">
              <span>Email not verified yet.</span>
              <button
                type="button"
                onClick={() => {
                  if (!email) { setError("Enter your email first."); return; }
                  resendVerification.mutate(
                    { email },
                    {
                      onSuccess: (data) => {
                        setError("");
                        if (data.emailSent === false) {
                          setError(data.message || "Could not send verification email.");
                        }
                      },
                      onError: (err) => setError(getErrorMessage(err))
                    }
                  );
                }}
                className="font-semibold text-brand-500 hover:text-brand-600 whitespace-nowrap transition-colors"
              >
                Resend code
              </button>
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

          {/* Only show role selector in register mode */}
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
                  Customer
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
                  Merchant
                </button>
              </div>
              <p className="mt-2 text-xs text-surface-400">
                {role === "merchant" ? "Seller accounts need store details before activation." : "Customer accounts can claim nearby rescue bundles."}
              </p>
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
            onRoleChange={setRole}
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
              setShowResend(false);
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
