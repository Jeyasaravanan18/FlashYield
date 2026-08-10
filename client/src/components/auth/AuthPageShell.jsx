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
    className: "min-h-screen bg-[#f4f4f4]",
    children: jsxs("div", {
      className: "grid min-h-screen grid-cols-1 lg:grid-cols-2",
      children: [
        jsxs("section", {
          className:
            "hidden h-screen overflow-hidden bg-[#111111] px-10 py-10 text-white lg:sticky lg:top-0 lg:flex lg:flex-col lg:justify-between xl:px-16",
          children: [
            jsxs("div", {
              children: [
                jsx(Link, {
                  to: "/",
                  className: "inline-flex items-center gap-3 text-2xl font-black uppercase tracking-tight text-white",
                  children: "FLASHYIELD"
                }),
                jsx("div", {
                  className: "mt-20 max-w-xl text-5xl font-light leading-[1.05] tracking-tight text-white xl:text-6xl",
                  children: "Rescue fresh food. Sell surplus faster."
                }),
                jsx("p", {
                  className: "mt-6 max-w-lg text-sm leading-6 text-white/62",
                  children:
                    "FlashYield keeps end-of-day surplus moving with verified customers, OTP-guarded access, pickup tokens, and merchant-ready tools for fast recovery."
                }),
                jsx("div", {
                  className: "mt-7 grid max-w-xl grid-cols-2 gap-3",
                  children: HIGHLIGHTS.map((item) =>
                    jsxs(
                      "div",
                      {
                        className: "border border-white/10 bg-white/[0.04] p-3",
                        children: [
                          jsx("div", { className: "text-sm font-semibold text-white", children: item.title }),
                          jsx("div", { className: "mt-1 text-xs leading-5 text-white/72", children: item.copy })
                        ]
                      },
                      item.title
                    )
                  )
                })
              ]
            }),
            jsxs("div", {
              className: "flex items-end justify-between gap-6 text-white/55",
              children: [
                jsx("div", { className: "text-sm", children: "© 2026 FlashYield" }),
                jsx("div", {
                  className: "grid grid-cols-3 gap-4",
                  children: STATS.map((item) =>
                    jsxs(
                      "div",
                      {
                        children: [
                          jsx("div", {
                            className: "text-[11px] uppercase tracking-[0.18em] text-white/38",
                            children: item.label
                          }),
                          jsx("div", { className: "mt-2 text-sm font-semibold text-white", children: item.value })
                        ]
                      },
                      item.label
                    )
                  )
                })
              ]
            })
          ]
        }),
        jsxs("section", {
          className: "flex min-h-screen items-center justify-center bg-[#f4f4f4] px-5 py-10 lg:px-12",
          children: [
            jsxs("div", {
              className: "w-full max-w-[560px]",
              children: [
                jsxs("div", {
                  className: "mb-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500",
                  children: [
                    jsx("span", { className: "inline-flex h-2.5 w-2.5 rounded-full bg-brand-500" }),
                    eyebrow
                  ]
                }),
                jsxs("div", {
                  className: "mb-8",
                  children: [
                    jsx("h1", { className: "text-4xl font-normal tracking-tight text-surface-900 sm:text-5xl", children: title }),
                    jsx("p", { className: "mt-2 max-w-lg text-sm leading-6 text-surface-500", children: subtitle })
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
