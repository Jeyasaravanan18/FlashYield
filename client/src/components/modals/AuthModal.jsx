import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useGoogleLogin, useLogin, useRegister } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Loader2, Leaf, X, Store, ShoppingBag } from "lucide-react";
import { GoogleSignInButton } from "../auth/GoogleSignInButton";
function AuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuthStore();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
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
        { email, password },
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
      register.mutate(
        { email, password, role },
        {
          onSuccess: (data) => {
            closeAuthModal();
            if (data.user.role === "merchant") {
              navigate("/merchant/onboarding");
            }
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
      setError("");
    }, 200);
  };
  const isPending = login.isPending || register.isPending || googleLogin.isPending;
  const handleGoogleLogin = (credential) => {
    setError("");
    googleLogin.mutate(credential, {
      onSuccess: (data) => {
        closeAuthModal();
        if (data.user.role === "merchant") navigate("/merchant");
        else if (data.user.role === "admin") navigate("/admin");
      },
      onError: (err) => setError(getErrorMessage(err))
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-black/40 backdrop-blur-sm", onClick: handleDismiss }),
    /* @__PURE__ */ jsxs("div", { className: "relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 animate-scale-in", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleDismiss,
          className: "absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors",
          children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-4 shadow-lg shadow-brand-500/20", children: /* @__PURE__ */ jsx(Leaf, { className: "w-6 h-6 text-white" }) }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-surface-900", children: mode === "login" ? "Welcome back" : "Create an account" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-surface-400", children: mode === "login" ? "Sign in to claim bundles" : "Join to save money and reduce waste" })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
        error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium", children: error }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "auth-email", className: "label", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "auth-email",
              type: "email",
              className: "input",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "name@example.com",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "auth-password", className: "label", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "auth-password",
              type: "password",
              className: "input",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              placeholder: mode === "login" ? "Enter your password" : "Create a password (min 6 chars)",
              required: true,
              minLength: 6
            }
          )
        ] }),
        mode === "register" && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: "Account type" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mt-1.5", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRole("customer"),
                className: `flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${role === "customer" ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                children: [
                  /* @__PURE__ */ jsx(ShoppingBag, { className: "w-4 h-4" }),
                  "Buy food"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRole("merchant"),
                className: `flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 ${role === "merchant" ? "border-brand-500 bg-brand-50 text-brand-600 shadow-sm shadow-brand-500/10" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                children: [
                  /* @__PURE__ */ jsx(Store, { className: "w-4 h-4" }),
                  "Sell food"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "btn-primary w-full py-3.5 mt-2",
            disabled: isPending,
            children: isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              mode === "login" ? "Signing in..." : "Creating account..."
            ] }) : mode === "login" ? "Sign In" : "Create Account"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-surface-400", children: [
          /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" }),
          "or",
          /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" })
        ] }),
        /* @__PURE__ */ jsx(GoogleSignInButton, { onCredential: handleGoogleLogin, disabled: isPending })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center mt-5 text-sm text-surface-400", children: [
        mode === "login" ? "Don't have an account?" : "Already have an account?",
        " ",
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            },
            className: "font-semibold text-brand-500 hover:text-brand-600 transition-colors",
            children: mode === "login" ? "Sign up" : "Sign in"
          }
        )
      ] })
    ] })
  ] });
}
export {
  AuthModal
};
