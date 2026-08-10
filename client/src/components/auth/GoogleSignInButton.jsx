import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Globe2 } from "lucide-react";

let googleScriptLoaded = false;
let googleScriptLoading = false;
let googleInitialized = false;
let globalCallback = null;

function GoogleSignInButton({ onCredential, disabled = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const allowLocalGoogle = import.meta.env.VITE_GOOGLE_DEV_ALLOWED === "true";
  const containerRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    globalCallback = onCredentialRef.current;
  }, [onCredential]);

  const [loaded, setLoaded] = useState(false);
  const isLocalhost = typeof window !== "undefined" && ["localhost", "127.0.0.1"].includes(window.location.hostname);

  useEffect(() => {
    if (!clientId || disabled || (isLocalhost && !allowLocalGoogle)) return;

    const renderBtn = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return;
      try {
        if (!googleInitialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              if (response?.credential && globalCallback) {
                globalCallback(response.credential);
              }
            },
            auto_select: false
          });
          googleInitialized = true;
        }
        containerRef.current.replaceChildren();
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: 320,
          shape: "rectangular"
        });
        setLoaded(true);
      } catch (e) {
        console.warn("[GSI] Init error", e);
      }
    };

    if (window.google?.accounts?.id) {
      renderBtn();
      return;
    }

    if (!googleScriptLoaded && !googleScriptLoading) {
      googleScriptLoading = true;
      const script = document.createElement("script");
      script.id = "google-identity-services";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => {
        googleScriptLoaded = true;
        googleScriptLoading = false;
        renderBtn();
      };
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderBtn();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [clientId, disabled, allowLocalGoogle, isLocalhost]);

  if (!clientId || (isLocalhost && !allowLocalGoogle)) {
    return /* @__PURE__ */ jsxs("p", { className: "text-center text-xs text-surface-400", children: [
      "Google sign-in is unavailable in local preview until ",
      /* @__PURE__ */ jsx("code", { children: "VITE_GOOGLE_CLIENT_ID" }),
      " is configured for this origin."
    ] });
  }

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
