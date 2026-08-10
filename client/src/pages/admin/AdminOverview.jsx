import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAdminMerchants, useUpdateMerchantStatus, useAuditLogs } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
function AdminOverview() {
  const [activeTab, setActiveTab] = useState("merchants");
  return /* @__PURE__ */ jsxs("div", { className: "page-container max-w-7xl animate-fade-in pb-14", children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-surface-50", children: "Admin" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Manage platform operations." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-1 mb-6", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab("merchants"),
          className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "merchants" ? "bg-surface-800 text-surface-200" : "text-surface-400 hover:text-surface-200"}`,
          children: "Merchants"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setActiveTab("audit"),
          className: `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "audit" ? "bg-surface-800 text-surface-200" : "text-surface-400 hover:text-surface-200"}`,
          children: "Audit logs"
        }
      )
    ] }),
    activeTab === "merchants" ? /* @__PURE__ */ jsx(MerchantsTab, {}) : /* @__PURE__ */ jsx(AuditLogsTab, {})
  ] });
}
function MerchantsTab() {
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data, isLoading } = useAdminMerchants({ status: statusFilter });
  const updateMutation = useUpdateMerchantStatus();
  const handleUpdateStatus = (id, newStatus) => {
    if (confirm(`Mark this merchant as ${newStatus}?`)) {
      updateMutation.mutate({ id, status: newStatus }, {
        onError: (err) => alert(getErrorMessage(err))
      });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: ["pending", "approved", "suspended", "rejected"].map((status) => /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => setStatusFilter(status),
        className: `px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === status ? "bg-surface-800 text-surface-200" : "text-surface-400 hover:text-surface-200"}`,
        children: status
      },
      status
    )) }),
    /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-400 text-sm", children: "Loading..." }) : !data || data.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-surface-400 text-sm", children: [
      "No ",
      statusFilter,
      " merchants."
    ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-surface-700 text-surface-400 text-xs", children: [
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Business" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Contact" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Address" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-700/50", children: data.data.map((merchant) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-800/30", children: [
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsx("div", { className: "font-medium text-surface-100", children: merchant.businessName }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 text-surface-400", children: [
          /* @__PURE__ */ jsx("div", { children: merchant.phone }),
          /* @__PURE__ */ jsx("div", { className: "text-xs", children: typeof merchant.userId === "object" ? merchant.userId.email : "" })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-400 max-w-xs truncate", children: merchant.address }),
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          merchant.verificationStatus !== "approved" && /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateStatus(merchant._id, "approved"), className: "btn-primary btn-sm", disabled: updateMutation.isPending, children: "Approve" }),
          merchant.verificationStatus !== "suspended" && /* @__PURE__ */ jsx("button", { onClick: () => handleUpdateStatus(merchant._id, "suspended"), className: "btn-danger btn-sm", disabled: updateMutation.isPending, children: "Suspend" })
        ] }) })
      ] }, merchant._id)) })
    ] }) }) })
  ] });
}
function AuditLogsTab() {
  const { data, isLoading } = useAuditLogs({ page: 1 });
  return /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-400 text-sm", children: "Loading..." }) : !data || data.data.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-400 text-sm", children: "No audit logs." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-surface-700 text-surface-400 text-xs", children: [
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Time" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Action" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Actor" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Target" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "IP" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-700/50 font-mono text-xs", children: data.data.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-800/30", children: [
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-400", children: new Date(log.timestamp).toLocaleString() }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-brand-600 font-medium", children: log.action }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-400", children: log.actorId }),
      /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 text-surface-400", children: [
        log.targetType,
        ": ",
        log.targetId
      ] }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-400", children: log.ipAddress })
    ] }, log._id)) })
  ] }) }) });
}
export {
  AdminOverview
};
