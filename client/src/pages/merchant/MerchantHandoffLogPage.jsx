import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { FileText, PencilLine } from "lucide-react";
import { useCreateHandoffLog, useMerchantHandoffLog } from "../../api/hooks";
import { useState } from "react";

function MerchantHandoffLogPage() {
  const { data, isLoading } = useMerchantHandoffLog();
  const createMutation = useCreateHandoffLog();
  const logs = data?.logs || [];
  const [newNote, setNewNote] = useState("");

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    createMutation.mutate({
      note: newNote,
      authorName: "Staff"
    }, {
      onSuccess: () => {
        setNewNote("");
      }
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
              jsx("h1", { className: "text-3xl font-bold text-surface-900", children: "Shift handoff log" }),
              jsx("p", { className: "text-sm text-surface-400 mt-1", children: "Track staff notes, pickup issues, and closeout summaries." })
            ]
          }),
          jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm", children: "Back to dashboard" })
        ]
      }),
      jsxs("div", { className: "card p-5 mb-6 flex flex-col gap-3", children: [
        jsx("textarea", { 
          className: "input h-24 resize-none", 
          placeholder: "Type a new shift note, incident, or closeout summary...",
          value: newNote,
          onChange: (e) => setNewNote(e.target.value)
        }),
        jsx("div", { className: "flex justify-end", children: 
          jsx("button", { 
            type: "button", 
            className: "btn-primary btn-sm", 
            onClick: handleAddNote, 
            disabled: createMutation.isPending || !newNote.trim(), 
            children: createMutation.isPending ? "Saving..." : "Save note" 
          })
        })
      ] }),
      isLoading ? jsx("div", { className: "card p-10 text-sm text-surface-400", children: "Loading handoff log..." }) : jsx("div", {
        className: "grid gap-4",
        children: logs.length === 0 ? jsx("div", { className: "card p-10 text-center text-surface-400", children: "No handoff notes yet." }) : logs.map((item) => jsxs("div", {
          className: "card p-5 flex items-start gap-4",
          children: [
            jsx("div", { className: "mt-0.5 rounded-xl bg-brand-50 p-3 text-brand-600", children: jsx(FileText, { className: "w-5 h-5" }) }),
            jsxs("div", { className: "flex-1", children: [
              jsx("h2", { className: "text-lg font-semibold text-surface-900", children: item.authorName || "Staff note" }), 
              jsx("p", { className: "text-sm text-surface-500 mt-1", children: item.note || item.summary || "" }), 
              jsx("p", { className: "text-xs text-surface-400 mt-2 font-mono", children: new Date(item.createdAt).toLocaleString() || "" })
            ] })
          ]
        }, item._id || item.id))
      })
    ]
  });
}

export { MerchantHandoffLogPage };
