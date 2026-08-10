import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { CalendarClock, CircleSlash, Clock3, Plus, RefreshCw } from "lucide-react";
import { useCancelSchedule, useMerchantSchedule, useUpdateSchedule } from "../../api/hooks";

function MerchantSchedulePage() {
  const { data, isLoading, isError } = useMerchantSchedule();
  const updateMutation = useUpdateSchedule();
  const cancelMutation = useCancelSchedule();
  const listings = data?.listings || [];

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
                      jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-500", children: [jsx(CalendarClock, { className: "h-3.5 w-3.5" }), "Merchant operations"] }),
                      jsx("h1", { className: "mt-2 font-display text-4xl font-bold uppercase leading-none text-surface-900 sm:text-5xl", children: "Scheduled posting" }),
                      jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-surface-500", children: "Review queued surplus drops, adjust their auto-publish time, or cancel listings before they go live." })
                    ]
                  }),
                  jsxs("div", {
                    className: "flex flex-wrap gap-3",
                    children: [
                      jsx(Link, { to: "/merchant", className: "btn-ghost btn-sm border border-surface-200 bg-white", children: "Dashboard" }),
                      jsx(Link, { to: "/merchant/listings/new", className: "btn-primary btn-sm", children: [jsx(Plus, { className: "h-4 w-4" }), "New listing"] })
                    ]
                  })
                ]
              }),
              jsxs("div", {
                className: "mt-6 grid gap-3 sm:grid-cols-3",
                children: [
                  jsx(SummaryCard, { label: "Queued listings", value: listings.length }),
                  jsx(SummaryCard, { label: "Next publish", value: getNextPublish(listings) }),
                  jsx(SummaryCard, { label: "Status", value: isLoading ? "Loading" : isError ? "Error" : "Synced", dark: true })
                ]
              })
            ]
          }),

          jsx("section", {
            className: "mt-5 rounded-2xl border border-surface-200 bg-white p-5 shadow-sm",
            children: isLoading
              ? jsx(StatePanel, { title: "Loading scheduled listings", subtitle: "Checking future auto-publish drops." })
              : isError
                ? jsx(StatePanel, { title: "Schedule unavailable", subtitle: "Check the backend connection and refresh this page." })
                : listings.length === 0
                  ? jsx(EmptySchedule, {})
                  : jsx("div", {
                    className: "grid gap-3",
                    children: listings.map((listing) => jsx(ScheduleRow, {
                      listing,
                      updateMutation,
                      cancelMutation
                    }, listing._id))
                  })
          })
        ]
      })
    ]
  });
}

function SummaryCard({ label, value, dark }) {
  return jsxs("div", {
    className: `rounded-2xl border p-5 shadow-sm ${dark ? "border-surface-300 bg-surface-900 text-white" : "border-surface-200 bg-surface-50 text-surface-900"}`,
    children: [
      jsx("div", { className: `text-xs font-bold uppercase tracking-wider ${dark ? "text-white/50" : "text-surface-400"}`, children: label }),
      jsx("div", { className: "mt-2 font-display text-3xl font-bold leading-none", children: value })
    ]
  });
}

function ScheduleRow({ listing, updateMutation, cancelMutation }) {
  const publishValue = listing.scheduledPublishAt ? toLocalInputValue(listing.scheduledPublishAt) : "";
  const claimStart = listing.claimWindowStart ? new Date(listing.claimWindowStart).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "--";
  const claimEnd = listing.claimWindowEnd ? new Date(listing.claimWindowEnd).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "--";

  return jsxs("div", {
    className: "grid gap-4 rounded-2xl border border-surface-200 bg-surface-50 p-4 lg:grid-cols-[1fr_290px_170px] lg:items-center",
    children: [
      jsxs("div", {
        className: "min-w-0",
        children: [
          jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [jsx("h2", { className: "truncate text-lg font-semibold text-surface-900", children: listing.title }), jsx("span", { className: "rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-600", children: "Scheduled" })] }),
          jsxs("div", { className: "mt-2 flex flex-wrap gap-3 text-xs text-surface-500", children: [
            jsxs("span", { className: "inline-flex items-center gap-1.5", children: [jsx(Clock3, { className: "h-3.5 w-3.5 text-brand-500" }), "Claims ", claimStart] }),
            jsxs("span", { children: ["Closes ", claimEnd] })
          ] })
        ]
      }),
      jsxs("label", {
        className: "block",
        children: [
          jsx("span", { className: "label", children: "Auto-publish time" }),
          jsx("input", {
            className: "input",
            type: "datetime-local",
            defaultValue: publishValue,
            onBlur: (event) => {
              if (event.target.value && event.target.value !== publishValue) {
                updateMutation.mutate({ id: listing._id, scheduledPublishAt: event.target.value });
              }
            }
          })
        ]
      }),
      jsxs("div", {
        className: "flex flex-wrap justify-start gap-2 lg:justify-end",
        children: [
          jsxs("button", {
            type: "button",
            className: "btn-ghost btn-sm border border-surface-200 bg-white",
            onClick: () => updateMutation.mutate({ id: listing._id, scheduledPublishAt: publishValue }),
            disabled: updateMutation.isPending,
            children: [jsx(RefreshCw, { className: "h-4 w-4" }), "Sync"]
          }),
          jsxs("button", {
            type: "button",
            className: "btn-danger btn-sm",
            onClick: () => cancelMutation.mutate(listing._id),
            disabled: cancelMutation.isPending,
            children: [jsx(CircleSlash, { className: "h-4 w-4" }), "Cancel"]
          })
        ]
      })
    ]
  });
}

function StatePanel({ title, subtitle }) {
  return jsxs("div", {
    className: "rounded-2xl border border-surface-200 bg-surface-50 p-10 text-center",
    children: [
      jsx("div", { className: "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500", children: jsx(CalendarClock, { className: "h-5 w-5" }) }),
      jsx("h2", { className: "text-lg font-semibold text-surface-900", children: title }),
      jsx("p", { className: "mt-1 text-sm text-surface-500", children: subtitle })
    ]
  });
}

function EmptySchedule() {
  return jsx(StatePanel, {
    title: "No scheduled listings",
    subtitle: "Create a listing with scheduling enabled to queue an auto-publish drop."
  });
}

function getNextPublish(listings) {
  const next = listings.find((listing) => listing.scheduledPublishAt)?.scheduledPublishAt;
  if (!next) return "--";
  return new Date(next).toLocaleString([], { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function toLocalInputValue(value) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export { MerchantSchedulePage };
