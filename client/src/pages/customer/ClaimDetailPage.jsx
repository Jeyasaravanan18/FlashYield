import { jsx, jsxs } from "react/jsx-runtime";
import { useParams, Link, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useMyClaims, useCancelClaim, useSubmitReview } from "../../api/hooks";
import { useCountdown } from "../../hooks/useCountdown";
import { ArrowLeft, MapPin, Clock, CheckCircle, XCircle, Copy, CheckCheck, Star } from "lucide-react";
import { useState } from "react";
function shortToken(token) {
  if (token.length <= 16) return token;
  return `${token.slice(0, 8)}\xB7\xB7\xB7${token.slice(-4)}`;
}
function ClaimDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, error } = useMyClaims();
  const cancelMutation = useCancelClaim();
  const [copied, setCopied] = useState(false);
  const claim = data?.data.find((c) => c._id === id);
  const listing = typeof claim?.listingId === "object" ? claim.listingId : null;
  const countdown = useCountdown(claim?.expiresAt || (/* @__PURE__ */ new Date()).toISOString());
  const isReserved = claim?.status === "reserved";
  const handleCopy = async () => {
    if (!claim?.token) return;
    await navigator.clipboard.writeText(claim.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  };
  const handleCancel = () => {
    if (!claim || !confirm("Cancel this pickup? The bundle will be released back to inventory.")) return;
    cancelMutation.mutate(claim._id, {
      onSuccess: () => navigate("/claims")
    });
  };
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "bg-surface-100 min-h-screen flex items-center justify-center", children: /* @__PURE__ */ jsx("div", { className: "w-8 h-8 border-3 border-surface-200 border-t-brand-500 rounded-full animate-spin" }) });
  }
  if (error || !claim) {
    return /* @__PURE__ */ jsx("div", { className: "bg-surface-100 min-h-screen pb-24 pt-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md mx-auto px-4 text-center py-20", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold text-surface-900 mb-2", children: "Ticket not found" }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm mb-6", children: "This ticket may have expired or doesn't exist." }),
      /* @__PURE__ */ jsx("button", { onClick: () => navigate(-1), className: "btn-secondary px-6 py-2.5", children: "Go Back" })
    ] }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "bg-surface-100 min-h-screen pb-24 pt-8", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "btn-ghost text-sm px-3 py-1.5", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "w-4 h-4" }),
        " Back to Feed"
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/claims", className: "btn-ghost text-sm px-3 py-1.5", children: "All Tickets" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-surface-900 to-surface-950 text-white rounded-3xl overflow-hidden relative shadow-2xl", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 rounded-full bg-surface-100" }),
      /* @__PURE__ */ jsx("div", { className: "absolute top-1/2 -translate-y-1/2 -right-4 w-8 h-8 rounded-full bg-surface-100" }),
      /* @__PURE__ */ jsxs("div", { className: "p-8 sm:p-10", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center gap-10 border-b border-white/10 pb-10 mb-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs font-medium mb-4", children: [
              /* @__PURE__ */ jsx("div", { className: `w-2 h-2 rounded-full ${isReserved ? "bg-accent-500 animate-pulse" : "bg-surface-500"}` }),
              /* @__PURE__ */ jsx("span", { className: "text-surface-400", children: isReserved ? "Confirmed Pickup" : claim.status === "collected" ? "Collected" : claim.status === "cancelled" ? "Cancelled" : "Expired" })
            ] }),
            /* @__PURE__ */ jsx("h1", { className: "font-display text-4xl sm:text-5xl font-bold uppercase leading-none tracking-tight mb-3 truncate", children: listing?.title ?? "Bundle" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-surface-400 text-sm", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3.5 h-3.5" }),
              listing?.merchant?.businessName ?? "Local Partner",
              " \xB7 ",
              listing?.merchant?.address ?? "See store"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex flex-col items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-white p-4 rounded-2xl shadow-lg mb-3", children: isReserved ? /* @__PURE__ */ jsx(QRCodeSVG, { value: claim.token, size: 130 }) : /* @__PURE__ */ jsx("div", { className: "w-[130px] h-[130px] flex items-center justify-center bg-surface-100 rounded-lg", children: /* @__PURE__ */ jsx(CheckCircle, { className: `w-10 h-10 ${claim.status === "collected" ? "text-accent-500" : "text-surface-400"}` }) }) }),
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-400 text-center", children: "Scan or show ID" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-10 sm:gap-20", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs font-medium text-surface-500 mb-1.5", children: "Token ID" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsx("div", { className: "font-display text-2xl sm:text-3xl font-bold uppercase tracking-wider truncate", children: shortToken(claim.token) }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: handleCopy,
                  className: "shrink-0 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors",
                  title: "Copy full token",
                  children: copied ? /* @__PURE__ */ jsx(CheckCheck, { className: "w-4 h-4 text-accent-400" }) : /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4 text-surface-400" })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsxs("div", { className: "text-xs font-medium text-surface-500 mb-1.5 flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
              " Expires In"
            ] }),
            /* @__PURE__ */ jsx("div", { className: `font-display text-3xl sm:text-4xl font-bold ${isReserved ? countdown.urgent ? "text-red-400" : "text-brand-400" : "text-surface-600"}`, children: isReserved ? countdown.label : "\u2014" })
          ] })
        ] }),
        isReserved && /* @__PURE__ */ jsxs("div", { className: "mt-8 pt-8 border-t border-white/10", children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCancel,
              disabled: cancelMutation.isPending,
              className: "flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl border border-red-400/30 text-red-400 hover:bg-red-400/10 font-semibold text-sm transition-all duration-200 disabled:opacity-50",
              children: [
                /* @__PURE__ */ jsx(XCircle, { className: "w-4 h-4" }),
                cancelMutation.isPending ? "Cancelling..." : "Cancel Pickup"
              ]
            }
          ),
          cancelMutation.error && /* @__PURE__ */ jsx("p", { className: "text-red-400 text-sm mt-2", children: cancelMutation.error.response?.data?.error?.message || "Failed to cancel" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid sm:grid-cols-3 gap-4 mt-8", children: [
      { step: "01", title: "Head to counter", desc: listing?.merchant?.address ?? "Your Storefront" },
      { step: "02", title: "Show your token", desc: `Present: ${shortToken(claim.token)} · ${claim.quantity || 1} item${(claim.quantity || 1) > 1 ? "s" : ""}` },
      { step: "03", title: "Collect bundle", desc: "Cashier confirms and hands over" }
    ].map((item) => /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-brand-50 text-brand-500 flex items-center justify-center text-sm font-bold mb-3", children: item.step }),
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-surface-900 text-sm mb-1", children: item.title }),
      /* @__PURE__ */ jsx("p", { className: "text-surface-400 text-sm break-all", children: item.desc })
    ] }, item.step)) }),
    claim.status === "collected" && /* @__PURE__ */ jsx("div", { className: "mt-8", children: /* @__PURE__ */ jsx(ReviewForm, { claimId: claim._id }) })
  ] }) });
}
function ReviewForm({ claimId }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const submitReview = useSubmitReview();
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return /* @__PURE__ */ jsxs("div", { className: "card p-6 text-center bg-green-50/50 border-green-100", children: [
      /* @__PURE__ */ jsx(CheckCircle, { className: "w-8 h-8 text-green-500 mx-auto mb-2" }),
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-green-800", children: "Thank You!" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-green-600 mt-1", children: "Your review helps other users and the merchant." })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "card p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "font-bold text-surface-900 mb-4", children: "Rate your experience" }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 mb-4", children: [1, 2, 3, 4, 5].map((star) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        className: "p-1",
        onMouseEnter: () => setHoverRating(star),
        onMouseLeave: () => setHoverRating(0),
        onClick: () => setRating(star),
        children: /* @__PURE__ */ jsx(
          Star,
          {
            className: `w-8 h-8 transition-colors ${star <= (hoverRating || rating) ? "fill-amber-400 text-amber-400" : "text-surface-200"}`
          }
        )
      },
      star
    )) }),
    /* @__PURE__ */ jsx(
      "textarea",
      {
        className: "input w-full min-h-[100px] mb-4 text-sm",
        placeholder: "How was the food and the pickup experience? (optional)",
        value: comment,
        onChange: (e) => setComment(e.target.value)
      }
    ),
    /* @__PURE__ */ jsx(
      "button",
      {
        disabled: rating === 0 || submitReview.isPending,
        onClick: () => {
          submitReview.mutate({ claimId, rating, comment }, {
            onSuccess: () => setSubmitted(true)
          });
        },
        className: "btn-primary w-full sm:w-auto px-8",
        children: submitReview.isPending ? "Submitting..." : "Submit Review"
      }
    ),
    submitReview.isError && /* @__PURE__ */ jsx("p", { className: "text-red-500 text-sm mt-2", children: submitReview.error.response?.data?.error?.message || "Failed to submit review. You may have already reviewed this claim." })
  ] });
}
export {
  ClaimDetailPage
};
