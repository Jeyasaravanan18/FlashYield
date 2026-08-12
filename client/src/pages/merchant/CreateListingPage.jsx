import { jsx, jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarClock,
  Camera,
  CheckCircle2,
  Clock3,
  CopyPlus,
  Image,
  Package,
  Percent,
  Sparkles,
  WandSparkles
} from "lucide-react";
import { useCameraSuggest, useCreateListing, useDuplicateLastListing, useMerchantTemplates, usePricingSuggestion, useUploadImage } from "../../api/hooks";
import { getErrorMessage } from "../../lib/api";

const fallbackImage = "";
const dietaryOptions = ["vegetarian", "vegan", "gluten-free", "nut-free", "dairy-free", "halal"];
const categories = [
  ["bakery", "Bakery"],
  ["prepared_meals", "Prepared meals"],
  ["produce", "Produce"],
  ["dairy", "Dairy"],
  ["beverages", "Beverages"],
  ["snacks", "Snacks"],
  ["mixed_bundle", "Mixed bundle"],
  ["other", "Other"]
];

const fallbackTemplates = [
  {
    title: "Artisan Pastry Box",
    description: "A mixed selection of today's fresh pastries and baked treats.",
    category: "bakery",
    originalPrice: 450,
    discountedPrice: 149,
    quantity: 6,
    dietaryTags: ["vegetarian"],
    allergenInfo: "Contains wheat, milk, eggs. May contain nuts.",
    handlingNotes: "Prepared today. Best enjoyed on the day of collection."
  },
  {
    title: "Chef's Meal Box",
    description: "A surprise end-of-day meal with one main and side items.",
    category: "prepared_meals",
    originalPrice: 350,
    discountedPrice: 129,
    quantity: 8,
    dietaryTags: [],
    allergenInfo: "Ask the counter team for today's dish allergens.",
    handlingNotes: "Keep chilled if not consumed immediately. Reheat thoroughly."
  },
  {
    title: "Fresh Produce Pack",
    description: "A value pack of seasonal fruits and vegetables.",
    category: "produce",
    originalPrice: 300,
    discountedPrice: 99,
    quantity: 10,
    dietaryTags: ["vegan", "gluten-free"],
    allergenInfo: "Packed in a facility that handles nuts.",
    handlingNotes: "Wash produce before consumption."
  }
];

const toInputValue = (date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function CreateListingPage() {
  const navigate = useNavigate();
  const createMutation = useCreateListing();
  const duplicateMutation = useDuplicateLastListing();
  const uploadImageMutation = useUploadImage();
  const cameraSuggest = useCameraSuggest();
  const { data: templatesData } = useMerchantTemplates();
  const now = useMemo(() => new Date(), []);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("bakery");
  const [dietaryTags, setDietaryTags] = useState([]);
  const [allergenInfo, setAllergenInfo] = useState("");
  const [handlingNotes, setHandlingNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [discountedPrice, setDiscountedPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [claimWindowStart, setClaimWindowStart] = useState(toInputValue(now));
  const [claimWindowEnd, setClaimWindowEnd] = useState(toInputValue(new Date(now.getTime() + 2 * 60 * 60 * 1000)));
  const [scheduledPublishAt, setScheduledPublishAt] = useState("");
  const [enableScheduling, setEnableScheduling] = useState(false);
  const [error, setError] = useState("");

  const original = Number(originalPrice) || 0;
  const discounted = Number(discountedPrice) || 0;
  const qty = Number(quantity) || 0;
  const discount = original > 0 && discounted < original ? Math.round(((original - discounted) / original) * 100) : 0;
  const savings = Math.max(0, original - discounted);
  const hoursLeft = Math.max(0, (new Date(claimWindowEnd).getTime() - Date.now()) / 3600000);
  const templates = templatesData?.templates?.length ? templatesData.templates : fallbackTemplates;
  const categoryLabel = categories.find(([value]) => value === category)?.[1] || "Other";
  const imagePreview = imageUrl.trim() || fallbackImage;
  const readyCount = [
    title.trim().length > 0,
    description.trim().length > 0,
    qty > 0,
    original > 0 && discounted >= 0 && discounted < original,
    new Date(claimWindowEnd) > new Date(claimWindowStart)
  ].filter(Boolean).length;

  const pricingSuggestion = usePricingSuggestion({
    originalPrice: original,
    quantity: qty,
    hoursLeft: Number(hoursLeft.toFixed(2)),
    discountedPrice: discounted
  });

  const setWindow = (hours) => {
    const start = new Date();
    setClaimWindowStart(toInputValue(start));
    setClaimWindowEnd(toInputValue(new Date(start.getTime() + hours * 60 * 60 * 1000)));
  };

  const applyPricingSuggestion = () => {
    const suggested = pricingSuggestion.data?.suggestedPrice;
    if (typeof suggested === "number" && !Number.isNaN(suggested)) {
      setDiscountedPrice(String(suggested));
    }
  };

  const applyTemplate = (template) => {
    setTitle(template.title || "");
    setDescription(template.description || "");
    setCategory(template.category || "other");
    setOriginalPrice(String(template.originalPrice || template.original || ""));
    setDiscountedPrice(String(template.discountedPrice || template.discounted || ""));
    setQuantity(String(template.quantity || ""));
    setDietaryTags(template.dietaryTags || template.tags || []);
    setAllergenInfo(template.allergenInfo || "");
    setHandlingNotes(template.handlingNotes || "");
  };

  const runCameraSuggest = () => {
    cameraSuggest.mutate(undefined, {
      onSuccess: (data) => {
        if (data?.title) setTitle(data.title);
        if (data?.category) setCategory(data.category);
        if (data?.suggestedDescription) setDescription(data.suggestedDescription);
        if (data?.suggestedTags) setDietaryTags(data.suggestedTags);
      },
      onError: (err) => setError(getErrorMessage(err))
    });
  };

  const duplicateLast = () => {
    duplicateMutation.mutate(undefined, {
      onSuccess: () => navigate("/merchant"),
      onError: (err) => setError(getErrorMessage(err))
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (discounted >= original) return setError("Rescue price must be lower than original price.");
    if (new Date(claimWindowEnd) <= new Date(claimWindowStart)) return setError("Pickup must end after claims open.");
    if (new Date(claimWindowEnd) <= new Date()) return setError("Choose a future pickup time.");
    if (enableScheduling && !scheduledPublishAt) return setError("Choose when the scheduled listing should publish.");
    if (enableScheduling && new Date(scheduledPublishAt) <= new Date()) return setError("Scheduled publish time must be in the future.");
    if (enableScheduling && new Date(scheduledPublishAt) > new Date(claimWindowStart)) return setError("Scheduled publish time must be before claims open.");

    createMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      category,
      imageUrl: imageUrl.trim() || fallbackImage,
      dietaryTags,
      allergenInfo: allergenInfo.trim(),
      handlingNotes: handlingNotes.trim(),
      originalPrice: original,
      discountedPrice: discounted,
      quantityTotal: qty,
      claimWindowStart: new Date(claimWindowStart).toISOString(),
      claimWindowEnd: new Date(claimWindowEnd).toISOString(),
      scheduledPublishAt: enableScheduling && scheduledPublishAt ? new Date(scheduledPublishAt).toISOString() : null
    }, {
      onSuccess: () => navigate("/merchant"),
      onError: (err) => setError(getErrorMessage(err))
    });
  };

  return jsxs("div", {
    className: "min-h-screen bg-[#f5f5f4] pb-16",
    children: [
      jsxs("main", {
        className: "mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8",
        children: [
          jsxs("div", {
            className: "mb-5 flex flex-col gap-4 border-b border-surface-200 pb-5 lg:flex-row lg:items-center lg:justify-between",
            children: [
              jsxs("div", {
                children: [
                  jsx("button", { type: "button", onClick: () => navigate("/merchant"), className: "mb-3 inline-flex items-center gap-2 text-sm font-semibold text-surface-500 hover:text-brand-500", children: [jsx(ArrowLeft, { className: "h-4 w-4" }), "Merchant dashboard"] }),
                  jsxs("div", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-500", children: [jsx(Sparkles, { className: "h-3.5 w-3.5" }), "New surplus drop"] }),
                  jsx("h1", { className: "mt-2 font-display text-4xl font-bold uppercase leading-none text-surface-900 sm:text-5xl", children: "Post a rescue bundle" }),
                  jsx("p", { className: "mt-3 max-w-2xl text-sm leading-6 text-surface-500", children: "Build the customer-facing listing, set a rescue price, choose the pickup window, and publish immediately or schedule it for later." })
                ]
              }),
              jsxs("div", {
                className: "flex flex-wrap gap-3",
                children: [
                  jsx("button", { type: "button", onClick: duplicateLast, className: "btn-secondary btn-sm", disabled: duplicateMutation.isPending, children: duplicateMutation.isPending ? "Duplicating..." : "Auto-repost last" }),
                  jsx("button", { type: "button", onClick: runCameraSuggest, className: "btn-primary btn-sm", disabled: cameraSuggest.isPending, children: [jsx(Camera, { className: "h-4 w-4" }), cameraSuggest.isPending ? "Scanning..." : "Camera suggest"] })
                ]
              })
            ]
          }),

          jsx("form", {
            onSubmit: handleSubmit,
            className: "grid gap-5 xl:grid-cols-[280px_1fr_360px] xl:items-start",
            children: [
              jsxs("aside", {
                className: "space-y-4 xl:sticky xl:top-24",
                children: [
                  jsxs("section", {
                    className: "rounded-2xl border border-surface-200 bg-white p-4 shadow-sm",
                    children: [
                      jsxs("div", { className: "mb-3 flex items-center gap-2", children: [jsx(WandSparkles, { className: "h-4 w-4 text-brand-500" }), jsx("h2", { className: "text-sm font-bold uppercase tracking-wider text-surface-900", children: "Start fast" })] }),
                      jsx("div", {
                        className: "grid gap-2",
                        children: templates.map((template) => jsx(TemplateButton, { key: template._id || template.title, template, onApply: applyTemplate }))
                      })
                    ]
                  }),
                  jsxs("section", {
                    className: "rounded-2xl border border-surface-200 bg-surface-900 p-4 text-white shadow-sm",
                    children: [
                      jsx("p", { className: "text-xs font-bold uppercase tracking-wider text-white/45", children: "Readiness" }),
                      jsx("div", { className: "mt-2 font-display text-4xl font-bold", children: `${readyCount}/5` }),
                      jsx("p", { className: "mt-1 text-xs leading-5 text-white/60", children: "Complete details, stock, pricing, and pickup window before publishing." })
                    ]
                  })
                ]
              }),

              jsxs("div", {
                className: "space-y-5",
                children: [
                  error ? jsx("div", { role: "alert", className: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700", children: error }) : null,

                  jsxs(FormSection, {
                    icon: Package,
                    title: "Bundle details",
                    subtitle: "This is what customers see before they claim.",
                    children: [
                      jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                        jsx(Field, { label: "Title", className: "sm:col-span-2", children: jsx("input", { className: "input", value: title, onChange: (event) => setTitle(event.target.value), placeholder: "Today's pastry rescue box", maxLength: 200, required: true }) }),
                        jsx(Field, { label: "Description", className: "sm:col-span-2", children: jsx("textarea", { className: "input min-h-28 resize-y", value: description, onChange: (event) => setDescription(event.target.value), placeholder: "Mention what is included, freshness, and any pickup notes.", maxLength: 2000, required: true }) }),
                        jsx(Field, { label: "Category", children: jsx("select", { className: "input", value: category, onChange: (event) => setCategory(event.target.value), children: categories.map(([value, label]) => jsx("option", { key: value, value, children: label })) }) }),
                        jsx(Field, { label: "Quantity available", children: jsx("input", { className: "input", type: "number", value: quantity, onChange: (event) => setQuantity(event.target.value), min: "1", step: "1", placeholder: "6", required: true }) }),
                        jsx(Field, { label: "Photo URL or Upload", className: "sm:col-span-2", children: jsxs("div", { className: "relative flex gap-2 items-center", children: [
                          jsxs("div", { className: "relative flex-grow", children: [
                            jsx(Image, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" }),
                            jsx("input", { className: "input pl-9", type: "url", value: imageUrl, onChange: (event) => setImageUrl(event.target.value), placeholder: "https://..." })
                          ]}),
                          jsx("label", { className: "btn-secondary shrink-0 cursor-pointer", children: [
                            uploadImageMutation.isPending ? "Uploading..." : "Upload",
                            jsx("input", {
                              type: "file",
                              accept: "image/*",
                              className: "hidden",
                              onChange: (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  uploadImageMutation.mutate(file, {
                                    onSuccess: (data) => setImageUrl(data.url),
                                    onError: (err) => setError("Image upload failed: " + getErrorMessage(err))
                                  });
                                }
                              }
                            })
                          ]})
                        ] }) })
                      ] }),
                      jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: dietaryOptions.map((tag) => jsx(TagButton, { key: tag, tag, active: dietaryTags.includes(tag), onToggle: () => setDietaryTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]) })) }),
                      jsxs("div", { className: "mt-4 grid gap-4 sm:grid-cols-2", children: [
                        jsx(Field, { label: "Allergen information", children: jsx("input", { className: "input", value: allergenInfo, onChange: (event) => setAllergenInfo(event.target.value), placeholder: "Contains gluten, dairy, eggs", maxLength: 500 }) }),
                        jsx(Field, { label: "Food handling notes", children: jsx("input", { className: "input", value: handlingNotes, onChange: (event) => setHandlingNotes(event.target.value), placeholder: "Keep refrigerated; consume today", maxLength: 500 }) })
                      ] })
                    ]
                  }),

                  jsxs(FormSection, {
                    icon: Percent,
                    title: "Rescue pricing",
                    subtitle: "Price must be lower than the original value.",
                    children: [
                      jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                        jsx(Field, { label: "Original price (Rs)", children: jsx("input", { className: "input", type: "number", value: originalPrice, onChange: (event) => setOriginalPrice(event.target.value), min: "1", placeholder: "450", required: true }) }),
                        jsx(Field, { label: "Rescue price (Rs)", children: jsx("input", { className: "input", type: "number", value: discountedPrice, onChange: (event) => setDiscountedPrice(event.target.value), min: "0", placeholder: "149", required: true }) })
                      ] }),
                      jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
                        jsx("button", { type: "button", onClick: applyPricingSuggestion, className: "btn-ghost btn-sm border border-surface-200 bg-white", disabled: pricingSuggestion.isPending || pricingSuggestion.data?.suggestedPrice == null, children: pricingSuggestion.isPending ? "Calculating..." : "Apply smart price" }),
                        pricingSuggestion.data?.suggestedPrice != null ? jsx("span", { className: "rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-600", children: `Suggested Rs ${pricingSuggestion.data.suggestedPrice}` }) : null,
                        original > 0 && discounted >= 0 ? jsx("span", { className: `rounded-full px-3 py-1.5 text-xs font-bold ${discount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`, children: discount > 0 ? `Customer saves Rs ${savings} (${discount}% off)` : "Rescue price must be lower" }) : null
                      ] })
                    ]
                  }),

                  jsxs(FormSection, {
                    icon: CalendarClock,
                    title: "Pickup window",
                    subtitle: "Claims open at the start time and expire at closing.",
                    children: [
                      jsx("div", { className: "mb-4 flex flex-wrap gap-2", children: [1, 2, 3].map((hours) => jsx("button", { key: hours, type: "button", onClick: () => setWindow(hours), className: "btn-ghost btn-sm border border-surface-200 bg-white", children: `${hours} hour${hours > 1 ? "s" : ""}` })) }),
                      jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
                        jsx(Field, { label: "Claims open", children: jsx("input", { className: "input", type: "datetime-local", value: claimWindowStart, onChange: (event) => setClaimWindowStart(event.target.value), required: true }) }),
                        jsx(Field, { label: "Pickup closes", children: jsx("input", { className: "input", type: "datetime-local", value: claimWindowEnd, onChange: (event) => setClaimWindowEnd(event.target.value), required: true }) })
                      ] })
                    ]
                  }),

                  jsxs(FormSection, {
                    icon: CopyPlus,
                    title: "Publish mode",
                    subtitle: "Publish now or prepare the listing for a later auto-post.",
                    children: [
                      jsxs("label", { className: "flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-surface-200 bg-surface-50 px-4 py-3", children: [
                        jsxs("span", { children: [jsx("span", { className: "block text-sm font-semibold text-surface-900", children: "Schedule this listing" }), jsx("span", { className: "mt-1 block text-xs text-surface-500", children: "Use this when stock is known but the drop should go live later." })] }),
                        jsx("input", { type: "checkbox", checked: enableScheduling, onChange: (event) => setEnableScheduling(event.target.checked), className: "h-5 w-5 accent-brand-500" })
                      ] }),
                      enableScheduling ? jsx("div", { className: "mt-4", children: jsx(Field, { label: "Publish at", children: jsx("input", { className: "input", type: "datetime-local", value: scheduledPublishAt, onChange: (event) => setScheduledPublishAt(event.target.value), min: toInputValue(now) }) }) }) : null
                    ]
                  }),

                  jsxs("div", { className: "flex flex-col-reverse gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm sm:flex-row sm:justify-end", children: [
                    jsx("button", { type: "button", onClick: () => navigate("/merchant"), className: "btn-ghost", children: "Discard" }),
                    jsx("button", { type: "submit", className: "btn-primary", disabled: createMutation.isPending, children: createMutation.isPending ? "Publishing..." : enableScheduling ? "Schedule listing" : "Publish listing" })
                  ] })
                ]
              }),

              jsx("aside", {
                className: "xl:sticky xl:top-24",
                children: jsx(PreviewCard, {
                  title,
                  description,
                  categoryLabel,
                  imagePreview,
                  original,
                  discounted,
                  discount,
                  qty,
                  dietaryTags,
                  claimWindowStart,
                  claimWindowEnd,
                  enableScheduling,
                  scheduledPublishAt
                })
              })
            ]
          })
        ]
      })
    ]
  });
}

function FormSection({ icon: Icon, title, subtitle, children }) {
  return jsxs("section", {
    className: "rounded-2xl border border-surface-200 bg-white p-5 shadow-sm",
    children: [
      jsxs("div", { className: "mb-5 flex items-start gap-3", children: [
        jsx("div", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500", children: jsx(Icon, { className: "h-5 w-5" }) }),
        jsxs("div", { children: [jsx("h2", { className: "font-semibold text-surface-900", children: title }), jsx("p", { className: "mt-1 text-sm text-surface-500", children: subtitle })] })
      ] }),
      children
    ]
  });
}

function Field({ label, className = "", children }) {
  return jsxs("div", {
    className,
    children: [
      jsx("label", { className: "label", children: label }),
      children
    ]
  });
}

function TemplateButton({ template, onApply }) {
  return jsxs("button", {
    type: "button",
    onClick: () => onApply(template),
    className: "rounded-xl border border-surface-200 bg-surface-50 px-3 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50",
    children: [
      jsx("span", { className: "block text-sm font-semibold text-surface-900", children: template.title }),
      jsxs("span", { className: "mt-1 flex items-center gap-2 text-xs text-surface-500", children: [
        jsx(Package, { className: "h-3.5 w-3.5 text-brand-500" }),
        `${template.quantity || 0} packs`,
        " · ",
        `Rs ${template.discountedPrice || template.discounted || 0}`
      ] })
    ]
  });
}

function TagButton({ tag, active, onToggle }) {
  return jsx("button", {
    type: "button",
    onClick: onToggle,
    className: `rounded-full border px-3 py-1.5 text-xs font-bold capitalize transition ${active ? "border-brand-500 bg-brand-500 text-white" : "border-surface-200 bg-white text-surface-500 hover:border-brand-300 hover:text-brand-500"}`,
    children: tag
  });
}

function PreviewCard({ title, description, categoryLabel, imagePreview, original, discounted, discount, qty, dietaryTags, claimWindowStart, claimWindowEnd, enableScheduling, scheduledPublishAt }) {
  const start = claimWindowStart ? new Date(claimWindowStart).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "--";
  const end = claimWindowEnd ? new Date(claimWindowEnd).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "--";
  const publishAt = scheduledPublishAt ? new Date(scheduledPublishAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "Now";

  return jsxs("div", {
    className: "overflow-hidden rounded-2xl border border-surface-200 bg-white shadow-sm",
    children: [
      jsx("div", { className: "h-44 bg-surface-200", children: jsx("img", { src: imagePreview, alt: "Listing preview", className: "h-full w-full object-cover", onError: (event) => { event.currentTarget.src = fallbackImage; } }) }),
      jsxs("div", {
        className: "p-5",
        children: [
          jsxs("div", { className: "flex items-center justify-between gap-3", children: [
            jsx("span", { className: "rounded-full bg-surface-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-surface-500", children: categoryLabel }),
            discount > 0 ? jsx("span", { className: "rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600", children: `${discount}% off` }) : null
          ] }),
          jsx("h3", { className: "mt-4 text-xl font-bold leading-tight text-surface-900", children: title || "Your rescue bundle" }),
          jsx("p", { className: "mt-2 line-clamp-3 text-sm leading-6 text-surface-500", children: description || "Add a short description so customers know what they are claiming." }),
          jsxs("div", { className: "mt-4 flex items-baseline gap-2", children: [
            jsx("span", { className: "font-display text-4xl font-bold text-brand-500", children: discounted > 0 ? `Rs ${discounted}` : "Rs --" }),
            original > 0 ? jsx("span", { className: "text-sm text-surface-400 line-through", children: `Rs ${original}` }) : null
          ] }),
          jsxs("div", { className: "mt-5 grid grid-cols-2 gap-3 border-t border-surface-200 pt-4", children: [
            jsx(PreviewMetric, { label: "Available", value: qty || 0 }),
            jsx(PreviewMetric, { label: "Publish", value: enableScheduling ? publishAt : "Now" }),
            jsx(PreviewMetric, { label: "Claims open", value: start }),
            jsx(PreviewMetric, { label: "Pickup closes", value: end })
          ] }),
          dietaryTags.length ? jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: dietaryTags.map((tag) => jsx("span", { key: tag, className: "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold capitalize text-emerald-700", children: tag })) }) : null,
          jsxs("div", { className: "mt-5 rounded-xl bg-surface-900 p-4 text-white", children: [
            jsxs("div", { className: "flex items-center gap-2 text-sm font-semibold", children: [jsx(CheckCircle2, { className: "h-4 w-4 text-emerald-400" }), "Customer claim flow"] }),
            jsxs("div", { className: "mt-3 grid gap-2 text-xs text-white/60", children: [
              jsxs("div", { className: "flex items-center gap-2", children: [jsx(Clock3, { className: "h-3.5 w-3.5" }), "Countdown starts when claims open"] }),
              "Inventory decrements on every claim",
              "Pickup token is verified at the counter"
            ] })
          ] })
        ]
      })
    ]
  });
}

function PreviewMetric({ label, value }) {
  return jsxs("div", {
    children: [
      jsx("div", { className: "text-[11px] font-bold uppercase tracking-wider text-surface-400", children: label }),
      jsx("div", { className: "mt-1 text-sm font-semibold text-surface-900", children: value })
    ]
  });
}

export { CreateListingPage };
