import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGoogleLogin, useLogin } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Loader2, Leaf } from "lucide-react";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const login = useLogin();
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    login.mutate(
      { email, password },
      {
        onSuccess: (data) => {
          const role = data.user.role;
          if (role === "customer" && from !== "/") {
            navigate(from);
          } else {
            navigate(role === "merchant" ? "/merchant" : role === "admin" ? "/admin" : "/");
          }
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        }
      }
    );
  };
  const handleGoogleLogin = (credential) => {
    setError("");
    googleLogin.mutate(credential, { onSuccess: (data) => navigate(data.user.role === "merchant" ? "/merchant" : data.user.role === "admin" ? "/admin" : from), onError: (err) => setError(getErrorMessage(err)) });
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-surface-100 via-white to-brand-500/5", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20", children: /* @__PURE__ */ jsx(Leaf, { className: "w-6 h-6 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-surface-900", children: "Welcome back" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-surface-400", children: "Sign in to your account" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "card p-7", children: [
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
        error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium", children: error }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "label", children: "Email" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "email",
              type: "email",
              className: "input",
              value: email,
              onChange: (e) => setEmail(e.target.value),
              placeholder: "name@example.com",
              required: true,
              autoComplete: "email"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "label", children: "Password" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              id: "password",
              type: "password",
              className: "input",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              placeholder: "Enter your password",
              required: true,
              autoComplete: "current-password"
            }
          )
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "submit",
            className: "btn-primary w-full py-3.5",
            disabled: login.isPending,
            children: login.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
              /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
              "Signing in..."
            ] }) : "Sign In"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-surface-400", children: [
        /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" }),
        "or",
        /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" })
      ] }),
      /* @__PURE__ */ jsx(GoogleSignInButton, { onCredential: handleGoogleLogin, disabled: login.isPending || googleLogin.isPending }),
      googleLogin.isPending && /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-xs text-surface-500", children: "Signing in with Google\u2026" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center mt-6 text-sm text-surface-400", children: [
      "Don't have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/register", className: "font-semibold text-brand-500 hover:text-brand-600 transition-colors", children: "Sign up" })
    ] })
  ] }) });
}
export {
  LoginPage
};
