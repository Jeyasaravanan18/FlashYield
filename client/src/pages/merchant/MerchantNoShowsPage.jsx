import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { AlertTriangle, MinusCircle, PlusCircle } from "lucide-react";
import { useMerchantNoShows, useUpdateNoShow } from "../../api/hooks";
import { useState } from "react";

function MerchantNoShowsPage() {
  const { data, isLoading } = useMerchantNoShows();
  const updateMutation = useUpdateNoShow();
  const [customerId, setCustomerId] = useState("");
  const [count, setCount] = useState(1);
  const records = data?.records || [];

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", { children: [jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }), jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "No-show management" }), jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Track repeat no-shows and adjust pickup verification." })] }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      jsxs("div", { className: "card p-5 mb-4 grid gap-3 md:grid-cols-[1fr_auto_auto_auto]", children: [
        jsx("input", { className: "input", value: customerId, onChange: (e) => setCustomerId(e.target.value), placeholder: "Customer ID" }),
        jsx("input", { className: "input", type: "number", min: "1", value: count, onChange: (e) => setCount(e.target.value) }),
        jsx("button", { className: "btn-primary btn-sm inline-flex items-center gap-2", type: "button", onClick: () => updateMutation.mutate({ customerId, count: Number(count) }), children: [jsx(PlusCircle, { className: "w-4 h-4" }), "Save"] }),
        jsx("span", { className: "text-xs text-surface-400 self-center", children: "Enter customer ID from claim records." })
      ] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading no-show records..." }) : jsxs("div", {
        className: "grid gap-4",
        children: records.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No no-show records yet." }) : records.map((record) => jsxs("div", {
          className: "card p-5 flex items-center justify-between gap-4",
          children: [
            jsxs("div", { children: [
              jsx("h2", { className: "text-lg font-semibold text-surface-900", children: record.customerId?.firstName ? `${record.customerId.firstName} ${record.customerId.lastName || ""}`.trim() : (record.customerId?.email || "Unknown Customer") }),
              jsx("p", { className: "text-xs font-mono text-surface-400", children: `ID: ${record.customerId?._id || record.customerId}` }),
              jsx("p", { className: "text-sm text-surface-500 mt-1", children: `${record.count} recorded no-shows` })
            ] }),
            jsx("span", { className: "badge-neutral inline-flex items-center gap-2", children: [jsx(AlertTriangle, { className: "w-4 h-4" }), "Monitor"] })
          ]
        }, record._id || record.id))
      })
    ]
  });
}

export { MerchantNoShowsPage };
