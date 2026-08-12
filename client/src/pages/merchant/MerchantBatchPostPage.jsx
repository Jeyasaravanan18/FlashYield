import { jsx, jsxs } from "react/jsx-runtime";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, FileUp, Wand2 } from "lucide-react";
import { useBatchUpload } from "../../api/hooks";
import { useState } from "react";

function parseCsv(text) {
  const lines = String(text || "").trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || "").trim();
    });
    
    // Add default values if missing
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    return {
      title: row.title || "Surplus Bundle",
      description: row.description || "",
      category: row.category || "other",
      originalPrice: Number(row.originalPrice) || 10,
      discountedPrice: Number(row.discountedPrice) || 5,
      quantityTotal: Number(row.quantityTotal) || 1,
      imageUrl: row.imageUrl || "",
      claimWindowStart: row.claimWindowStart || now.toISOString(),
      claimWindowEnd: row.claimWindowEnd || endOfDay.toISOString()
    };
  });
}

function MerchantBatchPostPage() {
  const navigate = useNavigate();
  const batchUpload = useBatchUpload();
  const [csvText, setCsvText] = useState("title,description,category,originalPrice,discountedPrice,quantityTotal\nPastry Box,Fresh pastries,bakery,450,149,6");
  const [preview, setPreview] = useState([]);
  const [error, setError] = useState(null);

  const handlePreview = () => {
    try {
      const rows = parseCsv(csvText);
      setPreview(rows);
      setError(null);
    } catch (err) {
      setError("Failed to parse CSV. Please check the format.");
    }
  };

  const handleUpload = () => {
    const rows = parseCsv(csvText);
    batchUpload.mutate(rows, {
      onSuccess: () => {
        navigate("/merchant");
      },
      onError: (err) => {
        setError(err.response?.data?.message || err.message || "Failed to upload batch");
      }
    });
  };

  return jsxs("div", {
    className: "page-container max-w-4xl pb-14 animate-fade-in py-10",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Batch posting" }),
              jsx("p", { className: "text-sm text-surface-500 mt-1", children: "Paste or import CSV rows, then publish multiple bundles at once." })
            ]
          }),
          jsx(Link, { to: "/merchant/listings/new", className: "btn-ghost btn-sm", children: "Single posting" })
        ]
      }),
      jsxs("div", { className: "card p-6 space-y-4", children: [
        error && jsx("div", { className: "bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm", children: error }),
        jsx("textarea", { className: "input min-h-48 font-mono text-sm", value: csvText, onChange: (e) => setCsvText(e.target.value) }),
        jsxs("div", { className: "flex flex-wrap gap-2", children: [
          jsx("button", { className: "btn-primary btn-sm inline-flex items-center gap-2", type: "button", onClick: handlePreview, children: [jsx(Wand2, { className: "w-4 h-4" }), "Preview batch"] }),
          jsx("button", { className: "btn-ghost btn-sm inline-flex items-center gap-2", type: "button", onClick: handleUpload, disabled: batchUpload.isPending, children: [jsx(FileUp, { className: "w-4 h-4" }), batchUpload.isPending ? "Uploading..." : "Upload CSV"] }),
          jsx("label", { className: "btn-ghost btn-sm inline-flex items-center gap-2 cursor-pointer", children: [jsx(ClipboardList, { className: "w-4 h-4" }), "Paste items", jsx("input", { type: "file", accept: ".csv,text/csv", className: "hidden", onChange: async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setCsvText(await file.text());
          } })] })
        ] }),
        preview.length > 0 && jsxs("div", { className: "rounded-xl border border-surface-200 overflow-hidden mt-6", children: [
          jsx("div", { className: "bg-surface-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-surface-500", children: "Preview" }),
          preview.map((item, index) => jsxs("div", { className: "px-4 py-3 border-t border-surface-100 text-sm flex justify-between", children: [
            jsxs("div", { children: [
              jsx("div", { className: "font-semibold text-surface-900", children: item.title }),
              jsx("div", { className: "text-xs text-surface-500", children: item.description })
            ] }),
            jsxs("div", { className: "text-right", children: [
              jsx("div", { className: "font-medium text-surface-900", children: `₹${item.discountedPrice}` }),
              jsx("div", { className: "text-xs text-surface-500", children: `Qty: ${item.quantityTotal}` })
            ] })
          ] }, index))
        ] })
      ] })
    ]
  });
}

export { MerchantBatchPostPage };

