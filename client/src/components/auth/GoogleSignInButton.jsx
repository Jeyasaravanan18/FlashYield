import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";
function GoogleSignInButton({ onCredential, disabled = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!clientId || disabled) return;
    const existing = document.getElementById("google-identity-services");
    const setup = () => {
      if (!window.google || !containerRef.current) return;
      window.google.accounts.id.initialize({ client_id: clientId, callback: (response) => response.credential && onCredential(response.credential), auto_select: false });
      containerRef.current.replaceChildren();
      window.google.accounts.id.renderButton(containerRef.current, { theme: "outline", size: "large", text: "continue_with", width: 320, shape: "rectangular" });
      setLoaded(true);
    };
    if (existing) {
      existing.addEventListener("load", setup);
      if (window.google) setup();
      return () => existing.removeEventListener("load", setup);
    }
    const script = document.createElement("script");
    script.id = "google-identity-services";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = setup;
    document.head.appendChild(script);
    return () => script.removeEventListener("load", setup);
  }, [clientId, disabled, onCredential]);
  if (!clientId) return /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-surface-400", children: [
    "Google sign-in is unavailable until ",
    /* @__PURE__ */ jsx("code", { children: "VITE_GOOGLE_CLIENT_ID" }),
    " is configured."
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "min-h-10 flex flex-col items-center justify-center", children: [
    /* @__PURE__ */ jsx("div", { ref: containerRef, className: disabled ? "pointer-events-none opacity-50" : "" }),
    !loaded && /* @__PURE__ */ jsxs("div", { className: "flex h-10 w-full max-w-[320px] items-center justify-center gap-2 rounded-lg border border-surface-200 text-sm text-surface-500", children: [
      /* @__PURE__ */ jsx(Globe2, { className: "w-4 h-4" }),
      "Loading Google\u2026"
    ] })
  ] });
}
export {
  GoogleSignInButton
};
