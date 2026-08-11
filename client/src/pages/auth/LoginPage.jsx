import { jsx, jsxs } from "react/jsx-runtime";
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
  const initialRole = location.state?.role || "customer";
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const resendVerification = useResendVerification();
  const navigate = useNavigate();
  const from = location.state?.from || "/";
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setNotice("");
    login.mutate(
      { email, password, role },
      {
        onSuccess: (data) => {
          const role = data.user.role;
          navigate(role === "merchant" ? "/merchant" : role === "admin" ? "/admin" : from);
        },
        onError: (err) => {
          const message = getErrorMessage(err);
          setError(message);
          if (message.toLowerCase().includes("verify your email")) {
            setNotice("We sent a fresh verification code to your inbox.");
          }
        }
      }
    );
  };
  const handleGoogleLogin = (credential) => {
    setError("");
    setNotice("");
    googleLogin.mutate({ credential, role, isLogin: true }, {
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
      { email, role },
      {
        onSuccess: (data) => {
          setError("");
          setNotice(data.message || "Verification code sent.");
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };
  return /* @__PURE__ */ jsx(AuthPageShell, { eyebrow: "Secure sign in", title: "Welcome back to FlashYield", subtitle: "Sign in to manage claims, pickup verification, merchant tools, and customer tickets.", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6 flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500", children: /* @__PURE__ */ jsx(Leaf, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("div", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-brand-500", children: "FlashYield" }),
        /* @__PURE__ */ jsx("div", { className: "text-sm text-surface-500", children: "Direct-connect surplus marketplace" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      error && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error }),
      notice && /* @__PURE__ */ jsx("div", { className: "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700", children: notice }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Account type" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setRole("customer"), className: `rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${role === "customer" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`, children: "Customer" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setRole("merchant"), className: `rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${role === "merchant" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`, children: "Merchant" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Email address" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Mail, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
          /* @__PURE__ */ jsx("input", { id: "email", type: "email", className: "input !pl-11", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@example.com", required: true, autoComplete: "email" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Password" }),
        /* @__PURE__ */ jsx("input", { id: "password", type: "password", className: "input", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "Enter your password", required: true, autoComplete: "current-password" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-4 text-sm", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: handleResend, className: "font-semibold text-brand-500 hover:text-brand-600", children: resendVerification.isPending ? "Sending..." : "Resend verification code" }),
        /* @__PURE__ */ jsx(Link, { to: "/forgot-password", state: { email, role }, className: "font-semibold text-surface-500 hover:text-surface-900", children: "Forgot password?" })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex w-full items-center justify-center py-3.5 text-base", disabled: login.isPending, children: login.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Signing in..."
      ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShieldCheck, { className: "h-4 w-4" }),
        "Sign in"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "my-6 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-surface-400", children: [
      /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" }),
      "or",
      /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" })
    ] }),
    /* @__PURE__ */ jsx(GoogleSignInButton, {
      onCredential: handleGoogleLogin,
      disabled: login.isPending || googleLogin.isPending,
      selectedRole: role,
      onRoleChange: setRole,
      showRoleSelector: false
    }),
    /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-surface-500", children: [
      "Don’t have an account? ",
      /* @__PURE__ */ jsx(Link, { to: "/register", className: "font-semibold text-brand-500 hover:text-brand-600", children: "Create one" })
    ] })
  ] }) });
}
export {
  LoginPage
};
