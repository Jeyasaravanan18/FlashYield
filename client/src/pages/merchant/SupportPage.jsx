import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { Bot, ChevronRight, LifeBuoy, Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChatAssistant } from "../../api/hooks";

const quickPrompts = [
  "How do I manage scheduled postings?",
  "How do I verify a pickup token?",
  "What should I do with a no-show?",
  "How can I improve bundle conversion?"
];

function SupportPage() {
  const chat = useChatAssistant();
  const scrollRef = useRef(null);
  const [message, setMessage] = useState("How do I manage scheduled postings?");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Ask about listings, pickup verification, schedules, no-shows, pricing, or customer support." }
  ]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, chat.isPending]);

  const send = (forcedMessage) => {
    const text = (forcedMessage ?? message).trim();
    if (!text) return;
    setMessages((current) => [...current, { role: "user", text }]);
    chat.mutate(text, {
      onSuccess: (data) => setMessages((current) => [...current, { role: "assistant", text: data.reply || "I can help with that." }]),
      onError: () => setMessages((current) => [...current, { role: "assistant", text: "I could not reach support right now. Check the backend connection and try again." }])
    });
    setMessage("");
  };

  return jsxs("div", {
    className: "min-h-screen bg-[#f5f5f4] pb-16",
    children: [
      jsxs("main", {
        className: "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8",
        children: [
          jsxs("section", {
            className: "rounded-2xl border border-surface-200 bg-white p-6 shadow-sm",
            children: [
              jsxs("div", {
                className: "flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between",
                children: [
                  jsxs("div", {
                    children: [
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-500", children: [jsx(LifeBuoy, { className: "h-3.5 w-3.5" }), "Support"] }),
                      jsx("h1", { className: "mt-2 font-display text-4xl font-bold uppercase leading-none text-surface-900 sm:text-5xl", children: "Assistant" }),
                      jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-surface-500", children: "Get merchant workflow help for scheduled drops, pickup tokens, pricing, no-shows, customer questions, and listing operations." })
                    ]
                  }),
                  jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm border border-surface-200 bg-white", children: "Dashboard" })
                ]
              }),
              jsx("div", {
                className: "mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4",
                children: quickPrompts.map((prompt) => jsx("button", {
                  type: "button",
                  onClick: () => send(prompt),
                  className: "group rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-left text-sm font-semibold text-surface-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600",
                  children: jsxs("span", { className: "flex items-center justify-between gap-3", children: [prompt, jsx(ChevronRight, { className: "h-4 w-4 text-surface-300 transition group-hover:text-brand-500" })] })
                }, prompt))
              })
            ]
          }),

          jsxs("section", {
            className: "mt-5 grid gap-5 lg:grid-cols-[340px_1fr]",
            children: [
              jsxs("aside", {
                className: "rounded-2xl border border-surface-200 bg-surface-900 p-5 text-white shadow-sm",
                children: [
                  jsxs("div", { className: "flex items-center gap-3", children: [
                    jsx("div", { className: "flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 text-white", children: jsx(Bot, { className: "h-5 w-5" }) }),
                    jsxs("div", { children: [jsx("h2", { className: "font-semibold", children: "Support assistant" }), jsx("p", { className: "mt-1 text-xs text-white/50", children: chat.isPending ? "Replying..." : "Ready" })] })
                  ] }),
                  jsxs("div", { className: "mt-6 grid gap-3 text-sm text-white/65", children: [
                    jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [jsx("div", { className: "font-semibold text-white", children: "Merchant help" }), jsx("p", { className: "mt-1 text-xs leading-5", children: "Listings, scheduling, no-show handling, pickup verification, pricing." })] }),
                    jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [jsx("div", { className: "font-semibold text-white", children: "Customer help" }), jsx("p", { className: "mt-1 text-xs leading-5", children: "Claims, tokens, pickup timing, waitlist, refunds, ratings." })] }),
                    jsxs("div", { className: "rounded-xl border border-white/10 bg-white/5 p-4", children: [jsx("div", { className: "font-semibold text-white", children: "Ops guidance" }), jsx("p", { className: "mt-1 text-xs leading-5", children: "Use this as a fast staff-facing guide during closing hours." })] })
                  ] })
                ]
              }),
              jsxs("div", {
                className: "overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm",
                children: [
                  jsxs("div", { className: "flex items-center justify-between border-b border-surface-200 px-5 py-4", children: [
                    jsxs("div", { className: "flex items-center gap-2", children: [jsx(Sparkles, { className: "h-4 w-4 text-brand-500" }), jsx("h2", { className: "font-semibold text-surface-900", children: "Conversation" })] }),
                    jsx("span", { className: "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700", children: "Live" })
                  ] }),
                  jsx("div", {
                    ref: scrollRef,
                    className: "max-h-[560px] min-h-[420px] overflow-y-auto bg-surface-50 p-5",
                    children: jsxs("div", {
                      className: "space-y-3",
                      children: [
                        messages.map((item, idx) => jsx(MessageBubble, { item }, `${item.role}-${idx}`)),
                        chat.isPending ? jsx("div", { className: "max-w-[80%] rounded-2xl border border-surface-200 bg-white px-4 py-3 text-sm text-surface-500", children: "Thinking..." }) : null
                      ]
                    })
                  }),
                  jsxs("div", {
                    className: "border-t border-surface-200 bg-white p-4",
                    children: [
                      jsxs("div", { className: "flex gap-2", children: [
                        jsx("input", { className: "input flex-1", value: message, onChange: (event) => setMessage(event.target.value), onKeyDown: (event) => event.key === "Enter" && send(), placeholder: "Ask about merchant operations..." }),
                        jsxs("button", { type: "button", className: "btn-primary btn-sm inline-flex items-center gap-2", onClick: () => send(), disabled: chat.isPending, children: [jsx(Send, { className: "h-4 w-4" }), "Send"] })
                      ] }),
                      jsx("p", { className: "mt-2 text-xs text-surface-400", children: "Replies are operational guidance for this app workflow." })
                    ]
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function MessageBubble({ item }) {
  const isAssistant = item.role === "assistant";
  return jsx("div", {
    className: `max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${isAssistant ? "border border-surface-200 bg-white text-surface-700" : "ml-auto bg-brand-500 text-white"}`,
    children: isAssistant ? jsx(FormattedAssistantText, { text: item.text }) : item.text
  });
}

function FormattedAssistantText({ text }) {
  const lines = normalizeAssistantText(text);

  return jsx("div", {
    className: "space-y-2 break-words",
    children: lines.map((line, index) => {
      const numbered = line.match(/^(\d+)\.\s+(.+)$/);
      if (numbered) {
        return jsxs("div", {
          className: "flex gap-2",
          children: [
            jsx("span", { className: "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-600", children: numbered[1] }),
            jsx("span", { className: "min-w-0", children: renderInlineMarkdown(numbered[2], `numbered-${index}`) })
          ]
        }, `line-${index}`);
      }

      const bullet = line.match(/^-\s+(.+)$/);
      if (bullet) {
        return jsxs("div", {
          className: "flex gap-2",
          children: [
            jsx("span", { className: "mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" }),
            jsx("span", { className: "min-w-0", children: renderInlineMarkdown(bullet[1], `bullet-${index}`) })
          ]
        }, `line-${index}`);
      }

      const heading = line.match(/^\*\*(.+?)\*\*:?\s*(.*)$/);
      if (heading) {
        return jsxs("div", {
          className: index === 0 ? "" : "pt-2",
          children: [
            jsx("div", { className: "font-semibold text-surface-900", children: heading[1] }),
            heading[2] ? jsx("div", { className: "mt-1", children: renderInlineMarkdown(heading[2], `heading-${index}`) }) : null
          ]
        }, `line-${index}`);
      }

      return jsx("p", { className: "whitespace-pre-wrap", children: renderInlineMarkdown(line, `plain-${index}`) }, `line-${index}`);
    })
  });
}

function normalizeAssistantText(text) {
  return String(text || "")
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\*\*(Quick tips|Where to find it|Need to adjust window\?):\*\*/gi, "\n**$1:**")
    .replace(/\*\*(\d+)\.\s+/g, "\n$1. ")
    .replace(/\s+(\d+)\.\s+/g, "\n$1. ")
    .replace(/\s*-\s+/g, "\n- ")
    .replace(/\s+(\d+)\.\s+/g, "\n$1. ")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function renderInlineMarkdown(text, keyPrefix) {
  return String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return jsx("strong", { className: "font-semibold text-surface-900", children: part.slice(2, -2) }, `${keyPrefix}-strong-${index}`);
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return jsx("em", { className: "text-surface-700", children: part.slice(1, -1) }, `${keyPrefix}-em-${index}`);
    }
    return part;
  });
}

export { SupportPage };
