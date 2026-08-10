import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { BadgeCheck, Camera, CircleCheck, KeyRound, ScanLine, ShieldCheck, ShieldX, Sparkles, Ticket } from "lucide-react";
import { useVerifyToken } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { QRScanner } from "../../components/QRScanner";

function VerifyTokenPage() {
  const [token, setToken] = useState("");
  const [result, setResult] = useState(null);
  const verifyMutation = useVerifyToken();

  const handleVerify = (event, tokenToVerify = null) => {
    if (event && event.preventDefault) event.preventDefault();
    setResult(null);
    const verifyValue = tokenToVerify || token;
    
    if (!/^[a-f0-9]{64}$/i.test(verifyValue)) {
      setResult({ type: "error", message: "Enter the full 64-character pickup token." });
      return;
    }
    verifyMutation.mutate(tokenToVerify || token, {
      onSuccess: (data) => {
        setResult({ type: "success", message: data.message || "Pickup verified successfully." });
        setToken("");
      },
      onError: (err) => setResult({ type: "error", message: getErrorMessage(err) })
    });
  };

  const handleScanSuccess = (decodedText) => {
    // If the scanner picks up the QR code, trigger verification
    const scannedToken = decodedText.toLowerCase().replace(/\s/g, "");
    if (/^[a-f0-9]{64}$/i.test(scannedToken)) {
      setToken(scannedToken);
      handleVerify(new Event("submit"), scannedToken);
    }
  };

  return jsxs("div", {
    className: "page-container max-w-6xl animate-fade-in py-10",
    children: [
      jsxs("div", {
        className: "mb-8",
        children: [
          jsx("p", { className: "text-xs font-semibold uppercase tracking-wider text-brand-600 mb-2", children: "Merchant operations" }),
          jsxs("div", {
            className: "flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between",
            children: [
              jsxs("div", {
                children: [
                  jsx("h1", { className: "text-4xl font-display font-bold text-surface-900 uppercase leading-[0.9]", children: "Verify a pickup" }),
                  jsx("p", { className: "mt-2 text-sm text-surface-500 max-w-2xl", children: "Scan a QR code or paste a claim token to mark a bundle as collected." })
                ]
              }),
              jsx("div", { className: "hidden lg:flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-700", children: [jsx(Sparkles, { className: "w-4 h-4" }), "Single-use verification"] })
            ]
          })
        ]
      }),
      jsxs("div", {
        className: "grid gap-6 lg:grid-cols-[300px_1fr]",
        children: [
          jsxs("aside", {
            className: "card p-6 space-y-4 self-start",
            children: [
              jsxs("div", {
                className: "rounded-2xl bg-surface-50 p-4 border border-surface-200",
                children: [
                  jsx("div", { className: "mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600", children: jsx(ScanLine, { className: "w-6 h-6" }) }),
                  jsx("h2", { className: "text-lg font-semibold text-surface-900", children: "How verification works" }),
                  jsx("p", { className: "mt-1 text-sm text-surface-500", children: "Keep this screen open at the counter. The token only works once and only for your merchant store." })
                ]
              }),
              jsxs("div", {
                className: "space-y-3",
                children: [
                  jsx(Step, { icon: Camera, title: "Scan", copy: "Read the customer QR code." }),
                  jsx(Step, { icon: KeyRound, title: "Verify", copy: "Tokens are single-use and time-bound." }),
                  jsx(Step, { icon: BadgeCheck, title: "Collect", copy: "Mark the pickup as handed over." })
                ]
              }),
              jsx("div", {
                className: "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800",
                children: "Only unexpired claims for your store can be collected."
              })
            ]
          }),
          jsxs("section", {
            className: "card p-6",
            children: [
              jsx("div", {
                className: "rounded-3xl border border-surface-200 bg-white p-5 shadow-sm",
                children: jsxs("form", {
                  onSubmit: (e) => handleVerify(e),
                  className: "space-y-5",
                  children: [
                    jsxs("div", {
                      className: "mb-6",
                      children: [
                        jsx("label", { className: "label mb-2", children: "Scan QR Code" }),
                        jsx(QRScanner, { onScanSuccess: handleScanSuccess })
                      ]
                    }),
                    jsxs("div", {
                      className: "relative flex items-center py-2",
                      children: [
                        jsx("div", { className: "flex-grow border-t border-surface-200" }),
                        jsx("span", { className: "flex-shrink-0 mx-4 text-surface-400 text-sm font-medium", children: "OR" }),
                        jsx("div", { className: "flex-grow border-t border-surface-200" }),
                      ]
                    }),
                    jsxs("div", {
                      children: [
                        jsx("label", { className: "label", children: "Pickup token" }),
                        jsx("textarea", {
                          value: token,
                          onChange: (event) => setToken(event.target.value.toLowerCase().replace(/\s/g, "")),
                          className: "input min-h-32 font-mono text-sm",
                          placeholder: "Paste the 64-character token",
                          autoComplete: "off",
                          spellCheck: false,
                          required: true
                        })
                      ]
                    }),
                    jsxs("div", {
                      className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
                      children: [
                        jsxs("div", {
                          className: "flex items-start gap-2 text-sm text-surface-500",
                          children: [
                            jsx(ShieldCheck, { className: "mt-0.5 w-4 h-4 text-brand-600 shrink-0" }),
                            jsx("span", { children: "Verification is restricted to your merchant account and only works for valid, unexpired claims." })
                          ]
                        }),
                        jsx("button", {
                          type: "submit",
                          disabled: verifyMutation.isPending || !token,
                          className: "btn-primary min-w-44 px-6 py-4 text-base inline-flex items-center justify-center gap-2",
                          children: verifyMutation.isPending ? "Verifying..." : "Verify & collect"
                        })
                      ]
                    })
                  ]
                })
              }),
              result && jsxs("div", {
                role: "status",
                className: `mt-5 rounded-2xl border p-4 flex gap-3 ${
                  result.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-red-200 bg-red-50 text-red-800"
                }`,
                children: [
                  result.type === "success"
                    ? jsx(CircleCheck, { className: "w-5 h-5 shrink-0 mt-0.5" })
                    : jsx(ShieldX, { className: "w-5 h-5 shrink-0 mt-0.5" }),
                  jsxs("div", {
                    children: [
                      jsx("p", { className: "font-semibold", children: result.type === "success" ? "Pickup confirmed" : "Verification failed" }),
                      jsx("p", { className: "text-sm mt-0.5 opacity-90", children: result.message })
                    ]
                  })
                ]
              }),
              jsxs("div", {
                className: "mt-5 grid gap-3 md:grid-cols-3",
                children: [
                  infoCard("Fast scan", "Use a scanner or paste the token."),
                  infoCard("Single use", "Tokens are consumed after verification."),
                  infoCard("Counter safe", "Designed for quick handoff at pickup.")
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function Step({ icon: Icon, title, copy }) {
  return jsxs("div", {
    className: "flex items-start gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4",
    children: [
      jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-900 text-white", children: jsx(Icon, { className: "w-4 h-4" }) }),
      jsxs("div", {
        children: [
          jsx("div", { className: "text-sm font-semibold text-surface-900", children: title }),
          jsx("div", { className: "text-xs text-surface-500 mt-0.5", children: copy })
        ]
      })
    ]
  });
}

function infoCard(title, copy) {
  return jsxs("div", {
    className: "rounded-2xl border border-surface-200 bg-surface-50 p-4",
    children: [
      jsx("div", { className: "text-xs font-bold uppercase tracking-wider text-surface-400", children: title }),
      jsx("div", { className: "mt-1 text-sm font-medium text-surface-900", children: copy })
    ]
  });
}

export { VerifyTokenPage };
