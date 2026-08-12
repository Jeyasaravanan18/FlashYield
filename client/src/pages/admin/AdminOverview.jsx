import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useAdminMerchants, useUpdateMerchantStatus, useAuditLogs, useAdminListings, useModerateListing, useAdminMetrics, useAdminUsers, useUpdateUserStatus, useAdminClaims, useAdminCancelClaim, useUnbanUser } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
export function AdminOverview() {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <div className="page-container max-w-7xl animate-fade-in pb-14">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-surface-900">Admin</h1>
        <p className="text-sm text-surface-500 mt-1">Manage platform operations.</p>
      </div>
      <div className="flex gap-1 mb-6">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "overview" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("merchants")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "merchants" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Merchants
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "users" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Customers
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "claims" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Claims
        </button>
        <button
          onClick={() => setActiveTab("listings")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "listings" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Listings
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === "audit" ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
        >
          Audit logs
        </button>
      </div>
      
      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "merchants" && <MerchantsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "claims" && <ClaimsTab />}
      {activeTab === "audit" && <AuditLogsTab />}
      {activeTab === "listings" && <ListingsTab />}
    </div>
  );
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
        className: `px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === status ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`,
        children: status
      },
      status
    )) }),
    /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-500 text-sm", children: "Loading..." }) : !data || data.data.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "p-12 text-center text-surface-500 text-sm", children: [
      "No ",
      statusFilter,
      " merchants."
    ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-surface-200 text-surface-500 text-xs", children: [
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Business" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Contact" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Address" }),
        /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Actions" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-200/50", children: data.data.map((merchant) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-50", children: [
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4", children: /* @__PURE__ */ jsx("div", { className: "font-medium text-surface-900", children: merchant.businessName }) }),
        /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 text-surface-500", children: [
          /* @__PURE__ */ jsx("div", { children: merchant.phone }),
          /* @__PURE__ */ jsx("div", { className: "text-xs", children: typeof merchant.userId === "object" ? merchant.userId.email : "" })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-500 max-w-xs truncate", children: merchant.address }),
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
  return /* @__PURE__ */ jsx("div", { className: "card overflow-hidden", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-500 text-sm", children: "Loading..." }) : !data || data.data.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-12 text-center text-surface-500 text-sm", children: "No audit logs." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-surface-200 text-surface-500 text-xs", children: [
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Time" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Action" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Actor" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "Target" }),
      /* @__PURE__ */ jsx("th", { className: "px-5 py-3 font-medium", children: "IP" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-surface-200/50 font-mono text-xs", children: data.data.map((log) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-surface-50", children: [
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-500", children: new Date(log.timestamp).toLocaleString() }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-brand-600 font-medium", children: log.action }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-500", children: log.actorId }),
      /* @__PURE__ */ jsxs("td", { className: "px-5 py-4 text-surface-500", children: [
        log.targetType,
        ": ",
        log.targetId
      ] }),
      /* @__PURE__ */ jsx("td", { className: "px-5 py-4 text-surface-500", children: log.ipAddress })
    ] }, log._id)) })
  ] }) }) });
}
function ListingsTab() {
  const [statusFilter, setStatusFilter] = useState("active");
  const { data, isLoading } = useAdminListings({ status: statusFilter });
  const moderateMutation = useModerateListing();
  const handleModerate = (id) => {
    if (confirm("Delete this listing for policy violation?")) {
      moderateMutation.mutate(id, {
        onError: (err) => alert(getErrorMessage(err))
      });
    }
  };
  return <div className="space-y-4">
    <div className="flex gap-1">
      {["active", "sold_out", "expired", "cancelled"].map((status) => <button
        key={status}
        onClick={() => setStatusFilter(status)}
        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === status ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
      >
        {status.replace("_", " ")}
      </button>)}
    </div>
    <div className="card overflow-hidden">
      {isLoading ? <div className="p-12 text-center text-surface-500 text-sm">Loading...</div> : !data || data.data.length === 0 ? <div className="p-12 text-center text-surface-500 text-sm">
        No {statusFilter.replace("_", " ")} listings.
      </div> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200 text-surface-500 text-xs">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Merchant</th>
              <th className="px-5 py-3 font-medium">Inventory</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200/50">
            {data.data.map((listing) => <tr key={listing._id} className="hover:bg-surface-50">
              <td className="px-5 py-4">
                <div className="font-medium text-surface-900">{listing.title}</div>
                <div className="text-xs text-surface-500">₹{listing.price}</div>
              </td>
              <td className="px-5 py-4 text-surface-500">
                <div>{listing.merchantId?.businessName || "Unknown"}</div>
                <div className="text-xs">{typeof listing.merchantId?.userId === "object" ? listing.merchantId?.userId?.email : ""}</div>
              </td>
              <td className="px-5 py-4 text-surface-500">
                {listing.quantityAvailable} / {listing.quantityTotal} available
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center rounded-full bg-surface-100 px-2.5 py-0.5 text-xs font-medium text-surface-700 capitalize">
                  {listing.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  {listing.status !== "cancelled" && <button
                    onClick={() => handleModerate(listing._id)}
                    className="btn-danger btn-sm"
                    disabled={moderateMutation.isPending}
                  >
                    Moderate
                  </button>}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </div>;
}

function OverviewTab() {
  const { data, isLoading } = useAdminMetrics();
  
  if (isLoading) return <div className="p-12 text-center text-surface-500 text-sm">Loading metrics...</div>;
  if (!data) return <div className="p-12 text-center text-surface-500 text-sm">No data available.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="card p-6 flex flex-col items-center justify-center text-center space-y-2">
        <h3 className="text-sm font-medium text-surface-500">Total Merchants (Active)</h3>
        <p className="text-4xl font-bold text-brand-500">{data.totalMerchants}</p>
      </div>
      <div className="card p-6 flex flex-col items-center justify-center text-center space-y-2">
        <h3 className="text-sm font-medium text-surface-500">Pending Approvals</h3>
        <p className="text-4xl font-bold text-yellow-500">{data.pendingMerchants}</p>
      </div>
      <div className="card p-6 flex flex-col items-center justify-center text-center space-y-2">
        <h3 className="text-sm font-medium text-surface-500">Registered Customers</h3>
        <p className="text-4xl font-bold text-surface-900">{data.totalUsers}</p>
      </div>
      <div className="card p-6 flex flex-col items-center justify-center text-center space-y-2">
        <h3 className="text-sm font-medium text-surface-500">Claims Today</h3>
        <p className="text-4xl font-bold text-green-500">{data.claimsToday}</p>
      </div>
    </div>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useAdminUsers({ page, limit: 20 });
  const updateMutation = useUpdateUserStatus();
  const unbanMutation = useUnbanUser();
  
  const handleUpdateStatus = (id, newStatus) => {
    if (confirm(`Mark this user as ${newStatus}?`)) {
      updateMutation.mutate({ id, status: newStatus }, {
        onError: (err) => alert(getErrorMessage(err))
      });
    }
  };

  const handleUnban = (id) => {
    if (confirm("Clear the claim penalty (unban) for this user?")) {
      unbanMutation.mutate(id, {
        onError: (err) => alert(getErrorMessage(err))
      });
    }
  };

  return <div className="space-y-4">
    <div className="card overflow-hidden">
      {isLoading ? <div className="p-12 text-center text-surface-500 text-sm">Loading...</div> : !data || data.data.length === 0 ? <div className="p-12 text-center text-surface-500 text-sm">
        No customers found.
      </div> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200 text-surface-500 text-xs">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Contact</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200/50">
            {data.data.map((user) => <tr key={user._id} className="hover:bg-surface-50">
              <td className="px-5 py-4">
                <div className="font-medium text-surface-900">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-surface-500">ID: {user._id}</div>
                <div className="text-[10px] font-bold text-brand-500 uppercase mt-1">{user.role}</div>
              </td>
              <td className="px-5 py-4 text-surface-500">
                <div>{user.email}</div>
                <div className="text-xs">{user.phone}</div>
              </td>
              <td className="px-5 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${user.status === "suspended" ? "bg-red-500/20 text-red-400" : "bg-surface-100 text-surface-700"}`}>
                  {user.status || "active"}
                </span>
                {user.claimBannedUntil && new Date(user.claimBannedUntil) > new Date() && (
                  <span className="inline-flex items-center rounded-full bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-400 mt-1 block w-fit">
                    Claim Banned
                  </span>
                )}
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  {user.status === "suspended" ? (
                    <button onClick={() => handleUpdateStatus(user._id, "active")} className="btn-primary btn-sm" disabled={updateMutation.isPending}>
                      Reactivate
                    </button>
                  ) : (
                    <button onClick={() => handleUpdateStatus(user._id, "suspended")} className="btn-danger btn-sm" disabled={updateMutation.isPending}>
                      Suspend
                    </button>
                  )}
                  {user.claimBannedUntil && new Date(user.claimBannedUntil) > new Date() && (
                    <button onClick={() => handleUnban(user._id)} className="btn-ghost btn-sm text-orange-500 border border-orange-500/20" disabled={unbanMutation.isPending}>
                      Unban Claim
                    </button>
                  )}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
      
      {data && data.pagination && data.pagination.totalPages > 1 && (
        <div className="border-t border-surface-200 px-5 py-3 flex items-center justify-between">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-surface-500 font-medium">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <button 
            onClick={() => setPage(p => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
            className="btn-ghost btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  </div>;
}

function ClaimsTab() {
  const [statusFilter, setStatusFilter] = useState("reserved");
  const { data, isLoading } = useAdminClaims({ status: statusFilter });
  const cancelMutation = useAdminCancelClaim();
  
  const handleCancel = (id) => {
    if (confirm("Cancel this claim and refund the inventory to the merchant?")) {
      cancelMutation.mutate(id, {
        onError: (err) => alert(getErrorMessage(err))
      });
    }
  };

  return <div className="space-y-4">
    <div className="flex gap-1">
      {["reserved", "collected", "cancelled", "expired"].map((status) => <button
        key={status}
        onClick={() => setStatusFilter(status)}
        className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${statusFilter === status ? "bg-surface-900 text-white" : "text-surface-500 hover:text-surface-900"}`}
      >
        {status}
      </button>)}
    </div>
    <div className="card overflow-hidden">
      {isLoading ? <div className="p-12 text-center text-surface-500 text-sm">Loading...</div> : !data || data.data.length === 0 ? <div className="p-12 text-center text-surface-500 text-sm">
        No {statusFilter} claims.
      </div> : <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-200 text-surface-500 text-xs">
              <th className="px-5 py-3 font-medium">Claim ID / Token</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Listing & Merchant</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200/50">
            {data.data.map((claim) => <tr key={claim._id} className="hover:bg-surface-50">
              <td className="px-5 py-4">
                <div className="font-medium text-surface-900">Token: {claim.token?.substring(0, 8)}...</div>
                <div className="text-xs text-surface-500 font-mono">ID: {claim._id}</div>
              </td>
              <td className="px-5 py-4 text-surface-500">
                <div>{claim.customerId?.firstName} {claim.customerId?.lastName}</div>
                <div className="text-xs">{claim.customerId?.email}</div>
              </td>
              <td className="px-5 py-4 text-surface-500">
                <div className="font-medium text-surface-900">{claim.listingId?.title} (x{claim.quantity})</div>
                <div className="text-xs">{claim.listingId?.merchantId?.businessName}</div>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  {claim.status === "reserved" && (
                    <button
                      onClick={() => handleCancel(claim._id)}
                      className="btn-danger btn-sm"
                      disabled={cancelMutation.isPending}
                    >
                      Cancel & Refund
                    </button>
                  )}
                </div>
              </td>
            </tr>)}
          </tbody>
        </table>
      </div>}
    </div>
  </div>;
}

