import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Leaf, Loader2, Store, ShoppingBag, ShieldCheck } from "lucide-react";
import { AuthPageShell } from "../../components/auth/AuthPageShell";
import { GoogleSignInButton } from "../../components/auth/GoogleSignInButton";
import { getErrorMessage } from "../../lib/api";
import { useGoogleLogin, useRegister } from "../../api/hooks";

const strongPasswordMessage = "Use 8+ characters with uppercase, lowercase, and a number.";
const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value);

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [merchantDetails, setMerchantDetails] = useState({
    businessName: "",
    phone: "",
    address: "",
    description: ""
  });
  const [error, setError] = useState("");

  const register = useRegister();
  const googleLogin = useGoogleLogin();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!isStrongPassword(password)) {
      setError(strongPasswordMessage);
      return;
    }
    const merchantProfile = role === "merchant" ? merchantDetails : undefined;
    register.mutate(
      { email, password, role, merchantProfile },
      {
        onSuccess: (data) => navigate("/verify-email", { state: { email, role, message: data.message, emailSent: data.emailSent } }),
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  const handleGoogleLogin = (credential) => {
    setError("");
    if (role === "merchant" && (!merchantDetails.businessName.trim() || !merchantDetails.phone.trim() || !merchantDetails.address.trim())) {
      setError("Enter store name, phone, and pickup address before continuing with Google.");
      return;
    }
    googleLogin.mutate(
      { credential, role, merchantProfile: role === "merchant" ? merchantDetails : undefined, isLogin: false },
      {
        onSuccess: (data) => {
          navigate(data.user.role === "merchant" ? "/merchant" : "/");
        },
        onError: (err) => setError(getErrorMessage(err))
      }
    );
  };

  const isPending = register.isPending || googleLogin.isPending;

  return jsx(AuthPageShell, {
    eyebrow: "Create account",
    title: role === "merchant" ? "Create Merchant Account" : "Create a customer account",
    subtitle:
      role === "merchant"
        ? "Set up your store and start listing surplus food."
        : "Join FlashYield to claim nearby bundles and save money.",
    children: jsxs("div", {
      className: "bg-transparent",
      children: [
        jsx("div", {
          className: "mb-6 flex items-center gap-3",
          children: jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              jsx("div", {
                className: "flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500",
                children: jsx(Leaf, { className: "h-6 w-6" })
              }),
              jsxs("div", {
                children: [
                  jsx("div", { className: "text-sm font-semibold uppercase tracking-[0.3em] text-brand-500", children: "FlashYield" }),
                  jsx("div", { className: "text-sm text-surface-500", children: "Email verification required" })
                ]
              })
            ]
          })
        }),
        jsxs("form", {
          onSubmit: handleSubmit,
          className: "space-y-5",
          children: [
            error && jsx("div", {
              className: "border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700",
              children: error
            }),
            jsxs("div", {
              children: [
                jsx("label", { className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Account type" }),
                jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    jsxs("button", {
                      type: "button",
                      onClick: () => setRole("customer"),
                      className: `flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-semibold transition ${role === "customer" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                      children: [
                        jsx(ShoppingBag, { className: "h-4 w-4" }),
                        "Customer"
                      ]
                    }),
                    jsxs("button", {
                      type: "button",
                      onClick: () => setRole("merchant"),
                      className: `flex items-center justify-center gap-2 border-2 px-4 py-3 text-sm font-semibold transition ${role === "merchant" ? "border-brand-500 bg-brand-50 text-brand-600" : "border-surface-200 text-surface-500 hover:border-surface-300 hover:bg-surface-50"}`,
                      children: [
                        jsx(Store, { className: "h-4 w-4" }),
                        "Merchant"
                      ]
                    })
                  ]
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", { htmlFor: "reg-email", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Email address" }),
                jsx("input", {
                  id: "reg-email",
                  type: "email",
                  className: "input",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: "name@example.com",
                  required: true,
                  autoComplete: "email"
                })
              ]
            }),
            jsxs("div", {
              children: [
                jsx("label", { htmlFor: "reg-password", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Password" }),
                jsx("input", {
                  id: "reg-password",
                  type: "password",
                  className: "input",
                  value: password,
                  onChange: (e) => setPassword(e.target.value),
                  placeholder: "Min. 8 characters",
                  required: true,
                  minLength: 8,
                  autoComplete: "new-password"
                }),
                jsx("p", {
                  className: "mt-2 text-xs text-surface-400",
                  children: strongPasswordMessage
                })
              ]
            }),
            role === "merchant" && jsxs("div", {
              className: "border border-brand-100 bg-brand-50/50 p-4 space-y-3",
              children: [
                jsxs("div", {
                  className: "flex items-center gap-2 text-sm font-semibold text-brand-600",
                  children: [
                    jsx(Store, { className: "h-4 w-4" }),
                    "Merchant details"
                  ]
                }),
                jsxs("div", {
                  children: [
                    jsx("label", { htmlFor: "reg-business-name", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Store / business name" }),
                    jsx("input", {
                      id: "reg-business-name",
                      type: "text",
                      className: "input",
                      value: merchantDetails.businessName,
                      onChange: (e) => setMerchantDetails((current) => ({ ...current, businessName: e.target.value })),
                      placeholder: "Jeya Sweets",
                      required: true
                    })
                  ]
                }),
                jsxs("div", {
                  children: [
                    jsx("label", { htmlFor: "reg-store-phone", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Store phone" }),
                    jsx("input", {
                      id: "reg-store-phone",
                      type: "tel",
                      className: "input",
                      value: merchantDetails.phone,
                      onChange: (e) => setMerchantDetails((current) => ({ ...current, phone: e.target.value })),
                      placeholder: "9876543210",
                      required: true
                    })
                  ]
                }),
                jsxs("div", {
                  children: [
                    jsx("label", { htmlFor: "reg-pickup-address", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Pickup address" }),
                    jsx("textarea", {
                      id: "reg-pickup-address",
                      className: "input min-h-24 resize-none",
                      value: merchantDetails.address,
                      onChange: (e) => setMerchantDetails((current) => ({ ...current, address: e.target.value })),
                      placeholder: "Street, area, city, pincode",
                      required: true
                    })
                  ]
                }),
                jsxs("div", {
                  children: [
                    jsx("label", { htmlFor: "reg-store-note", className: "mb-2 block text-sm font-semibold uppercase tracking-[0.24em] text-surface-500", children: "Store note" }),
                    jsx("textarea", {
                      id: "reg-store-note",
                      className: "input min-h-24 resize-none",
                      value: merchantDetails.description,
                      onChange: (e) => setMerchantDetails((current) => ({ ...current, description: e.target.value })),
                      placeholder: "Bakery, cafe, restaurant, home kitchen..."
                    })
                  ]
                })
              ]
            }),
            jsx("button", {
              type: "submit",
              className: "btn-primary flex w-full items-center justify-center rounded-none py-3.5 text-base",
              disabled: isPending,
              children: isPending
                ? jsxs("span", {
                    className: "flex items-center gap-2",
                    children: [
                      jsx(Loader2, { className: "h-4 w-4 animate-spin" }),
                      role === "merchant" ? "Creating merchant account..." : "Creating account..."
                    ]
                  })
                : jsxs("span", {
                    className: "inline-flex items-center gap-2",
                    children: [
                      jsx(ShieldCheck, { className: "h-4 w-4" }),
                      role === "merchant" ? "Create Merchant Account" : "Create Account"
                    ]
                  })
            })
          ]
        }),
        jsx("div", {
          className: "my-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.24em] text-surface-400",
          children: jsxs("div", {
            className: "flex w-full items-center gap-3",
            children: [
              jsx("span", { className: "h-px flex-1 bg-surface-200" }),
              "or",
              jsx("span", { className: "h-px flex-1 bg-surface-200" })
            ]
          })
        }),
        jsx(GoogleSignInButton, {
          onCredential: handleGoogleLogin,
          disabled: isPending,
          selectedRole: role,
          onRoleChange: setRole,
          showRoleSelector: false
        }),
        jsx("p", {
          className: "mt-6 text-center text-sm text-surface-500",
          children: jsxs("span", {
            children: [
              "Already have an account? ",
              jsx(Link, {
                to: "/login",
                className: "font-semibold text-brand-500 hover:text-brand-600",
                children: "Sign in"
              })
            ]
          })
        })
      ]
    })
  });
}

export {
  RegisterPage
};
