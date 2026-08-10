import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { api } from "../../lib/api";
import { useMerchantExports } from "../../api/hooks";

function MerchantExportsPage() {
  const { data, isLoading } = useMerchantExports();

  const downloadCsv = async () => {
    const res = await api.get("/merchants/features/exports");
    const blob = new Blob([res.data.csv || ""], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merchant-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    const res = await api.get("/merchants/features/exports");
    const pdfBase64 = res.data.pdfBase64 || "";
    const binary = atob(pdfBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "merchant-export.pdf";
    a.click();
    URL.revokeObjectURL(url);
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
              jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Tax and revenue exports" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Download CSV and PDF summaries for accounting." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      jsxs("div", { className: "card p-5 mb-4 flex flex-wrap gap-2", children: [
        jsx("button", { type: "button", className: "btn-primary btn-sm inline-flex items-center gap-2", onClick: downloadCsv, children: [jsx(FileSpreadsheet, { className: "w-4 h-4" }), "Download CSV"] }),
        jsx("button", { type: "button", className: "btn-ghost btn-sm inline-flex items-center gap-2", onClick: downloadPdf, children: [jsx(FileText, { className: "w-4 h-4" }), "Download PDF"] })
      ] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading exports..." }) : jsxs("div", {
        className: "grid gap-4",
        children: [
          jsx("div", { className: "card p-5", children: jsx("p", { className: "text-sm text-surface-400", children: `Revenue recovered: ₹${data?.revenueRecovered ?? 0}` }) }),
          jsx("div", { className: "card p-5", children: jsx("p", { className: "text-sm text-surface-400", children: `Best selling hours: ${(data?.bestSellingHours || []).map((item) => `${item.hour}:00`).join(", ") || "—"}` }) })
        ]
      })
    ]
  });
}

export { MerchantExportsPage };
