import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Leaf, Loader2, Mail, ShieldCheck } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { getErrorMessage } from "../../lib/api";
import { useGoogleLogin, useLogin, useResendVerification } from "../../api/hooks";

function LoginPage() {
  const location = useLocation();
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showResend, setShowResend] = useState(false);

  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const resendVerification = useResendVerification();
  const navigate = useNavigate();
  const from = location.state?.from || "/";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setShowResend(false);

    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          const userRole = data.user.role;
          navigate(userRole === "merchant" ? "/merchant" : userRole === "admin" ? "/admin" : from);
        },
        onError: (err) => {
          const message = getErrorMessage(err);
          setError(message);
          if (message.toLowerCase().includes("verify your email") || message.toLowerCase().includes("verification")) {
            setShowResend(true);
            setNotice("We sent a fresh verification code to your inbox.");
          }
        }
      }
    );
  };

  const handleGoogleLogin = (credential) => {
    setError("");
    setNotice("");
    setShowResend(false);
    googleLogin.mutate({ credential, isLogin: true }, {
      onSuccess: (data) => navigate(data.user.role === "merchant" ? "/merchant" : data.user.role === "admin" ? "/admin" : from),
      onError: (err) => setError(getErrorMessage(err))
    });
  };

  const handleResend = () => {
    if (!email) {
      setError("Enter your email first.");
      return;
    }
    resendVerification.mutate(
      { email },
      {
        onSuccess: (data) => {
          setError("");
          if (data.emailSent === false) {
            setNotice("");
            setError(data.message || "Verification email could not be sent. Check SMTP settings.");
            return;
          }
          setNotice(data.message || "Verification code sent.");
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  return (
    <AuthPageShell
      eyebrow="Secure sign in"
      title="Welcome back to FlashYield"
      subtitle="Sign in to manage claims, pickup verification, merchant tools, and customer tickets."
    >
      <div className="rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
            <Leaf className="h-6 w-6" />
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-brand-500">FlashYield</div>
            <div className="text-sm text-surface-500">Direct-connect surplus marketplace</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {notice}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500">
              Email address
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />
              <input
                id="email"
                type="email"
                className="input !pl-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            {showResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-brand-500 hover:text-brand-600 transition-colors"
              >
                {resendVerification.isPending ? "Sending..." : "Resend verification code"}
              </button>
            ) : (
              <span />
            )}
            <Link
              to="/forgot-password"
              state={{ email }}
              className="font-semibold text-surface-500 hover:text-surface-900 transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-primary flex w-full items-center justify-center py-3.5 text-base"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Sign in
              </span>
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-surface-400">
          <span className="h-px flex-1 bg-surface-200" />
          or
          <span className="h-px flex-1 bg-surface-200" />
        </div>

        <GoogleSignInButton
          onCredential={handleGoogleLogin}
          disabled={login.isPending || googleLogin.isPending}
          selectedRole="customer"
          onRoleChange={() => {}}
          showRoleSelector={false}
        />

        <p className="mt-6 text-center text-sm text-surface-500">
          Don't have an account?{" "}
          <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600">
            Create one
          </Link>
        </p>
      </div>
    </AuthPageShell>
  );
}

export { LoginPage };
