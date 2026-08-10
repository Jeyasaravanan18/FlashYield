import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";

const HIGHLIGHTS = [
  { title: "Verified access", copy: "Email OTP on sign-up and password reset." },
  { title: "Merchant ready", copy: "Pricing, scheduling, analytics, and pickup tools." },
  { title: "Real-time claims", copy: "Tokens, waitlists, and pickup verification." },
  { title: "Local-first", copy: "Built for nearby, high-conversion flash drops." }
];

const STATS = [
  { label: "Live sync", value: "Real-time" },
  { label: "Pickup token", value: "Single use" },
  { label: "Recovery focus", value: "Local surplus" }
];

function AuthPageShell({ eyebrow, title, subtitle, children }) {
  return jsx("div", {
    className:
      "min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,94,0,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(20,184,166,0.1),transparent_24%),linear-gradient(180deg,#fff7f1_0%,#ffffff_38%,#fffdfa_100%)]",
    children: jsxs("div", {
      className: "mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-10 px-4 py-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-8",
      children: [
        jsxs("section", {
          className:
            "hidden overflow-hidden rounded-[2rem] border border-white/60 bg-[#111111] p-8 text-white shadow-[0_30px_80px_rgba(0,0,0,0.18)] lg:flex lg:flex-col lg:justify-between",
          children: [
            jsxs("div", {
              children: [
                jsx(Link, {
                  to: "/",
                  className: "inline-flex items-center gap-3 text-lg font-black tracking-[0.35em] text-brand-500",
                  children: "FLASHYIELD"
                }),
                jsx("p", {
                  className: "mt-10 max-w-xl text-sm leading-6 text-white/72",
                  children:
                    "FlashYield keeps end-of-day surplus moving with verified customers, OTP-guarded access, pickup tokens, and merchant-ready tools for fast recovery."
                }),
                jsx("div", {
                  className: "mt-8 grid max-w-2xl grid-cols-2 gap-4",
                  children: HIGHLIGHTS.map((item) =>
                    jsxs(
                      "div",
                      {
                        className: "rounded-2xl border border-white/10 bg-white/5 p-4",
                        children: [
                          jsx("div", { className: "text-sm font-semibold text-white", children: item.title }),
                          jsx("div", { className: "mt-1 text-sm leading-6 text-white/72", children: item.copy })
                        ]
                      },
                      item.title
                    )
                  )
                })
              ]
            }),
            jsx("div", {
              className: "grid grid-cols-3 gap-4",
              children: STATS.map((item) =>
                jsxs(
                  "div",
                  {
                    className: "rounded-2xl border border-white/10 bg-white/5 p-4",
                    children: [
                      jsx("div", {
                        className: "text-xs uppercase tracking-[0.28em] text-white/50",
                        children: item.label
                      }),
                      jsx("div", { className: "mt-3 text-lg font-semibold", children: item.value })
                    ]
                  },
                  item.label
                )
              )
            })
          ]
        }),
        jsxs("section", {
          className: "flex items-center justify-center",
          children: [
            jsxs("div", {
              className: "w-full max-w-[520px]",
              children: [
                jsxs("div", {
                  className: "mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-brand-500",
                  children: [
                    jsx("span", { className: "inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" }),
                    eyebrow
                  ]
                }),
                jsxs("div", {
                  className: "mb-8",
                  children: [
                    jsx("h1", { className: "text-4xl font-black tracking-tight text-surface-900 sm:text-5xl", children: title }),
                    jsx("p", { className: "mt-3 max-w-lg text-base leading-7 text-surface-500", children: subtitle })
                  ]
                }),
                children
              ]
            })
          ]
        })
      ]
    })
  });
}

export {
  AuthPageShell
};
