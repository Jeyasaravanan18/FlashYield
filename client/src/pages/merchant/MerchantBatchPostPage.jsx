import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { ClipboardList, FileUp, Wand2 } from "lucide-react";
import { useBatchPreview, useBatchUpload } from "../../api/hooks";
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
    return row;
  });
}

function MerchantBatchPostPage() {
  const batchPreview = useBatchPreview();
  const batchUpload = useBatchUpload();
  const [csvText, setCsvText] = useState("title,description,category,originalPrice,discountedPrice,quantityTotal\nPastry Box,Fresh pastries,bakery,450,149,6");
  const [preview, setPreview] = useState([]);

  const rows = parseCsv(csvText);
  const handlePreview = () => {
    batchPreview.mutate({ items: rows }, {
      onSuccess: (data) => setPreview(data.items || rows)
    });
  };

  const handleUpload = () => {
    batchUpload.mutate(rows);
  };

  return jsxs("div", {
    className: "page-container max-w-4xl pb-14",
    children: [
      jsxs("div", {
        className: "flex items-end justify-between gap-4 mb-6",
        children: [
          jsxs("div", {
            children: [
              jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
              jsx("h1", { className: "text-3xl font-bold text-surface-50", children: "Batch posting" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Paste or import CSV rows, then publish multiple bundles at once." })
            ]
          }),
          jsx(Link, { to: "/merchant/listings/new", className: "btn-ghost btn-sm", children: "Single posting" })
        ]
      }),
      jsxs("div", { className: "card p-6 space-y-4", children: [
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
        preview.length > 0 && jsxs("div", { className: "rounded-xl border border-surface-200 overflow-hidden", children: [
          jsx("div", { className: "bg-surface-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-surface-400", children: "Preview" }),
          preview.map((item, index) => jsxs("div", { className: "px-4 py-3 border-t border-surface-100 text-sm flex justify-between", children: [jsx("span", { className: "text-surface-900", children: item.title }), jsx("span", { className: "text-surface-500", children: item.category || "other" })] }, index))
        ] })
      ] })
    ]
  });
}

export { MerchantBatchPostPage };
