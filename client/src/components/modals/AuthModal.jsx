import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { 
  useGoogleLogin, 
  useLogin, 
  useRegister, 
  useResendVerification,
  useVerifyEmail,
  useForgotPassword,
  useResetPassword
} from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Loader2, X, Store, ShoppingBag, ShieldAlert, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";

const strongPasswordMessage = "Use 8+ characters with uppercase, lowercase, and a number.";
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const [mode, setMode] = useState("login"); // login | register | verify-email | forgot-password | reset-password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [role, setRole] = useState("customer");
  const [merchantDetails, setMerchantDetails] = useState({
    businessName: "",
    phone: "",
    address: "",
    description: ""
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showResend, setShowResend] = useState(false);

  const login = useLogin();
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const resendVerification = useResendVerification();
  const verifyEmail = useVerifyEmail();
  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();
  const navigate = useNavigate();

  if (!isAuthModalOpen) return null;

  const handleDismiss = () => {
    closeAuthModal();
    setTimeout(() => {
      setMode("login");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setPhone("");
      setCode("");
      setRole("customer");
      setMerchantDetails({
        businessName: "",
        phone: "",
        address: "",
        description: ""
      });
      setError("");
      setMessage("");
      setShowResend(false);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
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
            const msg = getErrorMessage(err);
            setError(msg);
            if (msg.toLowerCase().includes("verify your email") || msg.toLowerCase().includes("verification")) {
              setShowResend(true);
            }
          }
        }
      );
    } else if (mode === "register") {
      if (!isStrongPassword(password)) {
        setError(strongPasswordMessage);
        return;
      }
      const merchantProfile = role === "merchant" ? merchantDetails : undefined;
      const fn = (role === "customer" && firstName.trim()) ? firstName.trim() : undefined;
      const ln = (role === "customer" && lastName.trim()) ? lastName.trim() : undefined;
      const ph = (role === "customer" && phone.trim()) ? phone.trim() : undefined;
      
      register.mutate(
        { email, password, role, firstName: fn, lastName: ln, phone: ph, merchantProfile },
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
    } else if (mode === "verify-email") {
      verifyEmail.mutate(
        { email, code, role },
        {
          onSuccess: () => {
            setMessage("Email verified. You can now sign in.");
            setCode("");
            setMode("login");
          },
          onError: (err) => setError(getErrorMessage(err))
        }
      );
    } else if (mode === "forgot-password") {
      forgotPassword.mutate(
        { email, role },
        {
          onSuccess: (data) => {
            if (data.emailSent === false) {
              setError(data.message || "Reset email could not be sent.");
              return;
            }
            setMessage(data.message || "Reset code sent.");
            setMode("reset-password");
          },
          onError: (err) => setError(getErrorMessage(err))
        }
      );
    } else if (mode === "reset-password") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      resetPassword.mutate(
        { email, code, password, role },
        {
          onSuccess: (data) => {
            setMessage(data.message || "Password updated successfully.");
            setCode("");
            setPassword("");
            setConfirmPassword("");
            setMode("login");
          },
          onError: (err) => setError(getErrorMessage(err))
        }
      );
    }
  };

  const isPending = 
    login.isPending || 
    register.isPending || 
    googleLogin.isPending || 
    verifyEmail.isPending || 
    forgotPassword.isPending || 
    resetPassword.isPending ||
    resendVerification.isPending;

  const handleGoogleLogin = (credential) => {
    setError("");
    setMessage("");
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
        role: mode === "login" ? undefined : role,
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

  const renderHeader = () => {
    let title = "Welcome back";
    let sub = "Sign in to claim local surplus bundles.";

    if (mode === "register") {
      title = "Create an account";
      sub = "Rescue fresh food. Sell surplus faster.";
    } else if (mode === "verify-email") {
      title = "Verify your email";
      sub = "Enter the one-time code sent to your inbox.";
    } else if (mode === "forgot-password") {
      title = "Account recovery";
      sub = "We'll send a code to reset your password.";
    } else if (mode === "reset-password") {
      title = "Reset password";
      sub = "Use the code to secure your account.";
    }

    return (
      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 flex items-center justify-center">
          <span className="text-3xl font-display font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent tracking-tight uppercase">
            FlashYield
          </span>
        </div>
        <h2 className="text-2xl font-normal tracking-tight text-surface-900 sm:text-3xl text-center">
          {title}
        </h2>
        <p className="mt-2 text-sm text-surface-500 text-center max-w-xs">
          {sub}
        </p>
      </div>
    );
  };

  const renderAccountTypeSelector = () => (
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
    </div>
  );

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

        {renderHeader()}

        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium">
              {message}
            </div>
          )}
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
                        } else {
                          setMessage(data.message || "Verification email sent.");
                          setMode("verify-email");
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

          {/* Role selector shown for all modes except login */}
          {mode !== "login" && renderAccountTypeSelector()}

          {/* Email input shown everywhere except some specific states if desired, but good to have everywhere */}
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

          {/* Code input for verification or password reset */}
          {(mode === "verify-email" || mode === "reset-password") && (
            <div>
              <label htmlFor="auth-code" className="label">
                6-digit code
              </label>
              <input
                id="auth-code"
                type="text"
                className="input tracking-[0.5em] text-center text-lg font-semibold"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
                required
              />
            </div>
          )}

          {/* Password input for login, register, reset-password */}
          {(mode === "login" || mode === "register" || mode === "reset-password") && (
            <div>
              <label htmlFor="auth-password" className="label">
                {mode === "reset-password" ? "New Password" : "Password"}
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
          )}

          {/* Confirm Password input for reset-password */}
          {mode === "reset-password" && (
            <div>
              <label htmlFor="auth-confirm-password" className="label">
                Confirm Password
              </label>
              <input
                id="auth-confirm-password"
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                required
                minLength={8}
              />
            </div>
          )}

          {/* Customer specific fields during registration */}
          {mode === "register" && role === "customer" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="customer-first-name" className="label">
                    First Name
                  </label>
                  <input
                    id="customer-first-name"
                    type="text"
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="customer-last-name" className="label">
                    Last Name
                  </label>
                  <input
                    id="customer-last-name"
                    type="text"
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="customer-phone" className="label">
                  Phone Number
                </label>
                <input
                  id="customer-phone"
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                />
              </div>
            </div>
          )}

          {/* Merchant specific fields during registration */}
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

          {/* Submit Button */}
          <button
            type="submit"
            className="btn-primary w-full py-3.5 mt-2"
            disabled={isPending}
          >
            {isPending ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </span>
            ) : mode === "login" ? (
              "Sign In"
            ) : mode === "register" ? (
              "Create Account"
            ) : mode === "verify-email" ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Verify Email
              </span>
            ) : mode === "forgot-password" ? (
              <span className="flex items-center justify-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Send Reset Code
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Reset Password
              </span>
            )}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode("forgot-password");
                setError("");
                setMessage("");
              }}
              className="text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        )}

        {mode === "login" && (
          <>
            <div className="my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-surface-400">
              <span className="h-px flex-1 bg-surface-200" />
              or
              <span className="h-px flex-1 bg-surface-200" />
            </div>

            <GoogleSignInButton
              onCredential={handleGoogleLogin}
              disabled={isPending}
              selectedRole="customer"
              onRoleChange={setRole}
              showRoleSelector={false}
            />
          </>
        )}

        <div className="text-center mt-5 text-sm text-surface-400 flex flex-col gap-2">
          {(mode === "login" || mode === "register") ? (
            <p>
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                  setMessage("");
                  setShowResend(false);
                }}
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Back to sign in
            </button>
          )}

          {mode === "verify-email" && (
             <button
              type="button"
              onClick={() => {
                if (!email) { setError("Enter your email first."); return; }
                resendVerification.mutate(
                  { email, role },
                  {
                    onSuccess: (data) => {
                      setError("");
                      if (data.emailSent === false) {
                        setError(data.message || "Could not send verification email.");
                        setMessage("");
                      } else {
                        setMessage(data.message || "Verification code resent.");
                      }
                    },
                    onError: (err) => setError(getErrorMessage(err))
                  }
                );
              }}
              className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Resend verification code
            </button>
          )}

          {mode === "forgot-password" && (
            <button
              type="button"
              onClick={() => {
                setMode("reset-password");
                setError("");
                setMessage("");
              }}
              className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
            >
              Already have a code? Reset password
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
