import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, Lock, Mail, ShoppingBag, Store } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { getErrorMessage } from "../../lib/api";
import { useResetPassword } from "../../api/hooks";

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || "";
  const initialRole = location.state?.role || "customer";
  const [email, setEmail] = useState(initialEmail);
  const [role, setRole] = useState(initialRole);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const resetPassword = useResetPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    resetPassword.mutate(
      { email, code, password, role },
      {
        onSuccess: (data) => {
          setMessage(data.message || "Password updated successfully.");
          setTimeout(() => navigate("/login", { state: { email, role } }), 1000);
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  return jsx(AuthPageShell, {
    eyebrow: "Reset access",
    title: "Create a new password",
    subtitle: "Use the code sent to your email to secure your FlashYield account.",
    children: jsxs("div", {
      className: "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8",
      children: [
        message && jsx("div", {
          className: "mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700",
          children: message
        }),
        error && jsx("div", {
          className: "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700",
          children: error
        }),
        jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-5",
          children: [
            jsxs("div", {
              children: [
                jsx("label", {
                  className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500",
                  children: "Account type"
                }),
                jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    jsxs("button", {
                      type: "button",
                      onClick: () => setRole("customer"),
                      className: `flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${role === "customer" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                      children: [
                        jsx(ShoppingBag, { className: "h-4 w-4" }),
                        "Customer"
                      ]
                    }),
                    jsxs("button", {
                      type: "button",
                      onClick: () => setRole("merchant"),
                      className: `flex items-center justify-center gap-2 rounded-2xl border-2 px-4 py-3 text-sm font-semibold transition ${role === "merchant" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                      children: [
                        jsx(Store, { className: "h-4 w-4" }),
                        "Merchant"
                      ]
                    })
                  ]
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", {
                  className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500",
                  children: "Email address"
                }),
                jsxs("div", {
                  className: "relative",
                  children: [
                    jsx(Mail, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                    jsx("input", {
                      type: "email",
                      className: "input !pl-11",
                      value: email,
                      onChange: (e) => setEmail(e.target.value),
                      placeholder: "name@example.com",
                      required: true,
                      autoComplete: "email"
                    })
                  ]
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", {
                  className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500",
                  children: "Reset code"
                }),
                jsx("input", {
                  type: "text",
                  className: "input tracking-[0.5em] text-center text-lg font-semibold",
                  value: code,
                  onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)),
                  placeholder: "000000",
                  inputMode: "numeric",
                  maxLength: 6,
                  required: true
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", {
                  className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500",
                  children: "New password"
                }),
                jsxs("div", {
                  className: "relative",
                  children: [
                    jsx(Lock, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                    jsx("input", {
                      type: "password",
                      className: "input !pl-11",
                      value: password,
                      onChange: (e) => setPassword(e.target.value),
                      placeholder: "Create a strong password",
                      required: true,
                      minLength: 8,
                      autoComplete: "new-password"
                    })
                  ]
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", {
                  className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500",
                  children: "Confirm password"
                }),
                jsx("input", {
                  type: "password",
                  className: "input",
                  value: confirmPassword,
                  onChange: (e) => setConfirmPassword(e.target.value),
                  placeholder: "Repeat the password",
                  required: true,
                  minLength: 8,
                  autoComplete: "new-password"
                })
              ]
            }),
            jsx("button", {
              type: "submit",
              className: "btn-primary flex w-full items-center justify-center py-3.5 text-base",
              disabled: resetPassword.isPending,
              children: resetPassword.isPending
                ? jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [
                      jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                      "Updating password..."
                    ]
                  })
                : jsxs("span", {
                    className: "inline-flex items-center gap-2",
                    children: [
                      jsx(CheckCircle2, { className: "h-4 w-4" }),
                      "Reset password"
                    ]
                  })
            }),
            jsx(Link, {
              to: "/login",
              state: { email, role },
              className: "block text-center text-sm font-semibold text-brand-500 hover:text-brand-600",
              children: "Back to sign in"
            })
          ]
        })
      ]
    })
  });
}

export { ResetPasswordPage };
