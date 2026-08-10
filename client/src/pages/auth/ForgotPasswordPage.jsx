import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Mail, ShieldAlert } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { getErrorMessage } from "../../lib/api";
import { useForgotPassword } from "../../api/hooks";
function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const forgotPassword = useForgotPassword();
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    forgotPassword.mutate(
      { email },
      {
        onSuccess: (data) => setMessage(data.message || "Reset code sent."),
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };
  return /* @__PURE__ */ jsx(AuthPageShell, { eyebrow: "Account recovery", title: "Forgot your password?", subtitle: "We’ll send a one-time reset code to your email so you can create a new password.", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8", children: [
    message && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700", children: message }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Email address" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Mail, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
          /* @__PURE__ */ jsx("input", { type: "email", className: "input !pl-11", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@example.com", required: true, autoComplete: "email" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "btn-primary flex w-full items-center justify-center py-3.5 text-base", disabled: forgotPassword.isPending, children: forgotPassword.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Sending code..."
      ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "h-4 w-4" }),
        "Send reset code"
      ] }) }),
      /* @__PURE__ */ jsx(Link, { to: "/reset-password", className: "block text-center text-sm font-semibold text-brand-500 hover:text-brand-600", state: { email }, children: "Already have a code? Reset password" })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-surface-500", children: "For verified Google accounts, use the same email and reset flow if needed." })
  ] }) });
}
export {
  ForgotPasswordPage
};
