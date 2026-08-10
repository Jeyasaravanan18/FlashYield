import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { BellRing, Trash2 } from "lucide-react";
import { useCreateHandoffLog, useMerchantNotifications } from "../../api/hooks";
import { useState } from "react";

function MerchantNotificationsPage() {
  const { data, isLoading } = useMerchantNotifications();
  const addNote = useCreateHandoffLog();
  const [note, setNote] = useState("");
  const notifications = data?.notifications || [];

  return jsxs("div", {
    className: "page-container max-w-5xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Notifications" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Closing soon, waitlist, pickup, and no-show signals." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      jsxs("div", { className: "card p-5 mb-4 flex gap-2", children: [
        jsx("input", { className: "input flex-1", value: note, onChange: (e) => setNote(e.target.value), placeholder: "Add a merchant note or alert" }),
        jsx("button", { className: "btn-primary btn-sm", type: "button", disabled: addNote.isPending || !note.trim(), onClick: () => addNote.mutate({ note }), children: "Add note" })
      ] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading notifications..." }) : jsxs("div", {
        className: "grid gap-4",
        children: notifications.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No alerts right now." }) : notifications.map((item) => jsxs("div", {
          className: "card p-5 flex items-start gap-4",
          children: [
            jsx("div", { className: "mt-0.5 rounded-xl bg-brand-50 p-3 text-brand-600", children: jsx(BellRing, { className: "w-5 h-5" }) }),
            jsxs("div", {
              className: "flex-1",
              children: [
                jsx("h2", { className: "text-lg font-semibold text-surface-50", children: item.title || item.type || "Alert" }),
                jsx("p", { className: "text-sm text-surface-400 mt-1", children: item.message || item.summary || "Operational update" }),
                jsx("p", { className: "text-xs text-surface-500 mt-2", children: item.createdAt || "" })
              ]
            }),
            jsx("button", { type: "button", className: "p-2 rounded-lg hover:bg-surface-100 text-surface-400", children: jsx(Trash2, { className: "w-4 h-4" }) })
          ]
        }, item._id || item.id))
      })
    ]
  });
}

export { MerchantNotificationsPage };
