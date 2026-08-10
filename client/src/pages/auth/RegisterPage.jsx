import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin, useRegister } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Loader2, Leaf, Store, ShoppingBag } from "lucide-react";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();
  const passwordOk = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/.test(password);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setPasswordTouched(true);
    if (!passwordOk) {
      setError("Password must be 8+ characters and include uppercase, lowercase, and a number.");
      return;
    }
    register.mutate(
      { email: email.trim().toLowerCase(), password, role },
      {
        onSuccess: (data) => {
          const r = data.user.role;
          if (r === "merchant") navigate("/merchant/onboarding");
          else navigate("/");
        },
        onError: (err) => {
          setError(getErrorMessage(err));
        }
      }
    );
  };
  const handleGoogleLogin = (credential) => {
    setError("");
    googleLogin.mutate(credential, {
      onSuccess: (data) => {
        const r = data.user.role;
        if (r === "merchant") navigate("/merchant/onboarding");
        else navigate("/");
      },
      onError: (err) => setError(getErrorMessage(err))
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-surface-100 via-white to-brand-500/5", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-sm animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx(Link, { to: "/", className: "w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mb-5 shadow-lg shadow-brand-500/20", children: /* @__PURE__ */ jsx(Leaf, { className: "w-6 h-6 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-surface-900", children: "Create an account" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-surface-400", children: "Join the community" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card p-7", children: /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Account type" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
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
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "reg-email", className: "label", children: "Email" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "reg-email",
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
        /* @__PURE__ */ jsx("label", { htmlFor: "reg-password", className: "label", children: "Password" }),
        /* @__PURE__ */ jsx("input", {
          id: "reg-password",
          type: "password",
          className: "input",
          value: password,
          onChange: (e) => setPassword(e.target.value),
          placeholder: "Min. 8 characters",
          required: true,
          minLength: 8,
          pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,128}$"
        }),
        passwordTouched && !passwordOk && /* @__PURE__ */ jsx("p", {
          className: "mt-2 text-xs text-amber-600",
          children: "Use 8+ characters with uppercase, lowercase, and a number."
        })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "btn-primary w-full py-3.5",
          disabled: register.isPending || googleLogin.isPending,
          children: register.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center justify-center gap-2", children: [
            /* @__PURE__ */ jsx(Loader2, { className: "w-4 h-4 animate-spin" }),
            "Creating account..."
          ] }) : "Create Account"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-wider text-surface-400", children: [
      /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" }),
      "or",
      /* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-surface-200" })
    ] }),
    /* @__PURE__ */ jsx(GoogleSignInButton, { onCredential: handleGoogleLogin, disabled: register.isPending || googleLogin.isPending }),
    googleLogin.isPending && /* @__PURE__ */ jsx("p", { className: "mt-3 text-center text-xs text-surface-500", children: "Signing in with Google\u2026" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center mt-6 text-sm text-surface-400", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "font-semibold text-brand-500 hover:text-brand-600 transition-colors", children: "Sign in" })
    ] })
  ] }) });
}
export {
  RegisterPage
};
