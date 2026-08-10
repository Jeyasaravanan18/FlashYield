import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { getErrorMessage } from "../../lib/api";
import { useResendVerification, useVerifyEmail } from "../../api/hooks";
function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(initialEmail ? "We sent a code to your inbox. Enter it below to activate your account." : "");
  const [error, setError] = useState("");
  const verifyEmail = useVerifyEmail();
  const resendVerification = useResendVerification();
  const canSubmit = useMemo(() => email && code.length >= 4, [email, code]);
  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    verifyEmail.mutate(
      { email, code },
      {
        onSuccess: () => {
          setMessage("Email verified. You can now sign in.");
          setTimeout(() => navigate("/login", { state: { email } }), 900);
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };
  const handleResend = () => {
    if (!email) {
      setError("Enter your email to resend the code.");
      return;
    }
    resendVerification.mutate(
      { email },
      {
        onSuccess: (data) => setMessage(data.message || "Verification code resent."),
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };
  return /* @__PURE__ */ jsx(AuthPageShell, { eyebrow: "Confirm your email", title: "Verify your account", subtitle: "Enter the one-time code sent to your inbox to unlock FlashYield.", children: /* @__PURE__ */ jsxs("div", { className: "rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8", children: [
    message && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700", children: message }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Email address" }),
        /* @__PURE__ */ jsx("input", { type: "email", className: "input", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "name@example.com", required: true })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "6-digit code" }),
        /* @__PURE__ */ jsx("input", { type: "text", className: "input tracking-[0.5em] text-center text-lg font-semibold", value: code, onChange: (e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6)), placeholder: "000000", inputMode: "numeric", maxLength: 6, required: true })
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", disabled: verifyEmail.isPending || !canSubmit, className: "btn-primary flex w-full items-center justify-center py-3.5 text-base", children: verifyEmail.isPending ? /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
        "Verifying..."
      ] }) : /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "h-4 w-4" }),
        "Verify email"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-sm", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: handleResend, className: "font-semibold text-brand-500 hover:text-brand-600", children: resendVerification.isPending ? "Resending..." : "Resend code" }),
        /* @__PURE__ */ jsx(Link, { to: "/login", className: "font-semibold text-surface-500 hover:text-surface-900", children: "Back to sign in" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-sm text-surface-500", children: "If you used Google sign-in, the account is already verified." })
  ] }) });
}
export {
  VerifyEmailPage
};
