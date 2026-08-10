import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { FileText, PencilLine } from "lucide-react";
import { useCreateHandoffLog, useMerchantHandoffLog } from "../../api/hooks";

function MerchantHandoffLogPage() {
  const { data, isLoading } = useMerchantHandoffLog();
  const createMutation = useCreateHandoffLog();
  const logs = data?.logs || [];

  const addQuickNote = () => {
    createMutation.mutate({
      note: "End-of-day closeout completed. No unusual issues."
    });
  };

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Shift handoff log" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Track staff notes, pickup issues, and closeout summaries." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      jsxs("div", { className: "flex gap-2 mb-4", children: [jsx("button", { type: "button", className: "btn-primary btn-sm", onClick: addQuickNote, disabled: createMutation.isPending, children: createMutation.isPending ? "Saving..." : "Add closeout note" }), jsx("span", { className: "text-xs text-surface-400 self-center", children: "Use the API to build richer editable notes later." })] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading handoff log..." }) : jsx("div", {
        className: "grid gap-4",
        children: logs.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No handoff notes yet." }) : logs.map((item) => jsxs("div", {
          className: "card p-5 flex items-start gap-4",
          children: [
            jsx("div", { className: "mt-0.5 rounded-xl bg-brand-50 p-3 text-brand-600", children: jsx(FileText, { className: "w-5 h-5" }) }),
            jsxs("div", { className: "flex-1", children: [jsx("h2", { className: "text-lg font-semibold text-surface-50", children: item.authorName || "Staff note" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: item.note || item.summary || "" }), jsx("p", { className: "text-xs text-surface-500 mt-2", children: item.createdAt || "" })] }),
            jsx(PencilLine, { className: "w-4 h-4 text-surface-500" })
          ]
        }, item._id || item.id))
      })
    ]
  });
}

export { MerchantHandoffLogPage };
