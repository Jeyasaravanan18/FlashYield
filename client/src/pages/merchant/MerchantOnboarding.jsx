import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateMerchantProfile } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";
import { Store, MapPin } from "lucide-react";
function MerchantOnboarding() {
  const navigate = useNavigate();
  const createMutation = useCreateMerchantProfile();
  const [error, setError] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [isLocating, setIsLocating] = useState(false);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (!res.ok) throw new Error("Reverse geocoding failed");
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          } else {
            setError("Could not resolve address from coordinates");
          }
        } catch (err) {
          setError(err.message || "Failed to fetch address");
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setError("Location access denied or unavailable");
        setIsLocating(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    createMutation.mutate({
      businessName,
      description,
      address,
      phone
    }, {
      onSuccess: () => navigate("/merchant"),
      onError: (err) => setError(getErrorMessage(err))
    });
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-[calc(100vh-4rem)] flex flex-col items-center py-12 px-4", children: /* @__PURE__ */ jsxs("div", { className: "w-full max-w-lg animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center mb-8", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsx(Store, { className: "w-5 h-5 text-white" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold text-surface-900", children: "Set up your business" }),
      /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm text-surface-500", children: "Complete your profile to start listing" })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "card p-6 space-y-4", children: [
      error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700", children: error }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Business name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            className: "input",
            value: businessName,
            onChange: (e) => setBusinessName(e.target.value),
            placeholder: "e.g. The Daily Bakery",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-1", children: [
          /* @__PURE__ */ jsx("label", { className: "label mb-0", children: "Address" }),
          /* @__PURE__ */ jsxs("button", { 
            type: "button", 
            onClick: handleUseCurrentLocation,
            disabled: isLocating,
            className: "btn-ghost text-[10px] uppercase tracking-wider py-1 px-2 flex items-center gap-1", 
            children: [
              /* @__PURE__ */ jsx(MapPin, { className: "w-3 h-3" }),
              isLocating ? "Locating..." : "Use Current Location"
            ] 
          })
        ]}),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "input resize-none min-h-[80px]",
            value: address,
            onChange: (e) => setAddress(e.target.value),
            placeholder: "Full street address for pickup",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Phone" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            className: "input",
            value: phone,
            onChange: (e) => setPhone(e.target.value),
            placeholder: "+1 234 567 8900",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: "Description (optional)" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            className: "input resize-none min-h-[80px]",
            value: description,
            onChange: (e) => setDescription(e.target.value),
            placeholder: "Tell customers about your store..."
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: "btn-primary w-full",
          disabled: createMutation.isPending,
          children: createMutation.isPending ? "Setting up..." : "Complete setup"
        }
      )
    ] })
  ] }) });
}
export {
  MerchantOnboarding
};
