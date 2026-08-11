import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, Mail, ShieldAlert, ShoppingBag, Store } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { getErrorMessage } from "../../lib/api";
import { useForgotPassword } from "../../api/hooks";

function ForgotPasswordPage() {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || "");
  const [role, setRole] = useState(location.state?.role || "customer");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    forgotPassword.mutate(
      { email, role },
      {
        onSuccess: (data) => {
          if (data.emailSent === false) {
            setMessage("");
            setError(data.message || "Reset email could not be sent. Check SMTP settings.");
            return;
          }
          setMessage(data.message || "Reset code sent.");
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  return jsx(AuthPageShell, {
    eyebrow: "Account recovery",
    title: "Forgot your password?",
    subtitle: "We’ll send a one-time reset code to your email so you can create a new password.",
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
            jsx("button", {
              type: "submit",
              className: "btn-primary flex w-full items-center justify-center py-3.5 text-base",
              disabled: forgotPassword.isPending,
              children: forgotPassword.isPending
                ? jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [
                      jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                      "Sending code..."
                    ]
                  })
                : jsxs("span", {
                    className: "inline-flex items-center gap-2",
                    children: [
                      jsx(ShieldAlert, { className: "h-4 w-4" }),
                      "Send reset code"
                    ]
                  })
            }),
            jsx(Link, {
              to: "/reset-password",
              className: "block text-center text-sm font-semibold text-brand-500 hover:text-brand-600",
              state: { email, role },
              children: "Already have a code? Reset password"
            })
          ]
        }),
        jsx("p", {
          className: "mt-6 text-sm text-surface-500",
          children: "For verified Google accounts, use the same email and reset flow if needed."
        })
      ]
    })
  });
}

export { ForgotPasswordPage };
