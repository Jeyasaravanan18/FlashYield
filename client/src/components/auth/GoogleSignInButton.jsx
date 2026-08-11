import { useEffect, useRef, useState } from "react";
import { Globe2, ShoppingBag, Store } from "lucide-react";

let googleScriptLoaded = false;
let googleScriptLoading = false;
let googleInitialized = false;
let globalCallback = null;

export function GoogleSignInButton({ 
  onCredential, 
  disabled = false, 
  selectedRole = "customer", 
  onRoleChange, 
  showRoleSelector = false 
}) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);
  
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    globalCallback = onCredentialRef.current;
  }, [onCredential]);

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!clientId || disabled) return;

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
      const existingScript = document.getElementById("google-identity-services");
      if (existingScript) {
        googleScriptLoaded = true;
        googleScriptLoading = false;
        renderBtn();
        return;
      }
      
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
  }, [clientId, disabled]);

  return (
    <div className={showRoleSelector ? "rounded-2xl border border-surface-200 bg-surface-50/70 p-4" : "flex justify-center"}>
      {showRoleSelector && (
        <>
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-surface-500">
                Google sign-in role
              </div>
              <p className="mt-1 text-sm text-surface-500">
                {selectedRole === "merchant" ? "Continue as a store owner." : "Continue as a customer."}
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-brand-500 shadow-sm">
              {selectedRole}
            </span>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={disabled || !onRoleChange}
              onClick={() => onRoleChange?.("customer")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                selectedRole === "customer" 
                  ? "border-brand-500 bg-white text-brand-600 shadow-sm" 
                  : "border-surface-200 bg-white/70 text-surface-500 hover:border-surface-300"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Customer
            </button>
            <button
              type="button"
              disabled={disabled || !onRoleChange}
              onClick={() => onRoleChange?.("merchant")}
              className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition ${
                selectedRole === "merchant" 
                  ? "border-brand-500 bg-white text-brand-600 shadow-sm" 
                  : "border-surface-200 bg-white/70 text-surface-500 hover:border-surface-300"
              }`}
            >
              <Store className="h-4 w-4" />
              Merchant
            </button>
          </div>
        </>
      )}

      {!clientId ? (
        <p className="text-center text-xs text-surface-400">
          Google sign-in is unavailable until <code>VITE_GOOGLE_CLIENT_ID</code> is configured.
        </p>
      ) : (
        <div className="min-h-10 flex flex-col items-center justify-center">
          <div ref={containerRef} className={disabled ? "pointer-events-none opacity-50" : ""} />
          {!loaded && (
            <div className="flex h-10 w-full max-w-[320px] items-center justify-center gap-2 rounded-lg border border-surface-200 bg-white text-sm text-surface-500">
              <Globe2 className="w-4 h-4" />
              Loading Google...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
