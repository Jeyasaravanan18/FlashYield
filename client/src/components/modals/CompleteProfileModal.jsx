import { useState, useEffect } from "react";
import { UserCircle, AlertCircle, Loader2, X } from "lucide-react";
import { useUpdateProfile } from "../../api/hooks";
import { useAuthStore } from "../../store/authStore";

export function CompleteProfileModal({ isOpen, onClose }) {
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState(null);

  // If user has no first name (customer) or no business name (merchant), they are forced to complete onboarding
  const isForced = user?.role === "customer" 
    ? (!user?.firstName || !user?.lastName || !user?.phone)
    : (!user?.merchantProfile?.businessName || !user?.merchantProfile?.address || !user?.merchantProfile?.phone);

  // Initialize fields if they exist
  useEffect(() => {
    if (user && isOpen) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setPhone(user.role === "merchant" ? (user.merchantProfile?.phone || user.phone || "") : (user.phone || ""));
      setBusinessName(user.merchantProfile?.businessName || "");
      setAddress(user.merchantProfile?.address || "");
      setError(null);
    }
  }, [user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);

    const payload = user.role === "merchant" 
      ? { merchantProfile: { businessName, address, phone } }
      : { firstName, lastName, phone };

    updateProfile.mutate(
      payload,
      {
        onSuccess: () => {
          onClose(); // Successfully updated
        },
        onError: (err) => {
          setError(err?.response?.data?.error?.message || "Failed to update profile.");
        }
      }
    );
  };

  const handleClose = () => {
    if (!isForced) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full animate-scale-in overflow-hidden">
        
        {!isForced && (
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-xl text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-4 border-b border-surface-200 px-6 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shrink-0">
            <UserCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-surface-900">
              {isForced ? "Complete your profile" : "Edit Profile"}
            </h2>
            <p className="mt-1 text-sm text-surface-500">
              {isForced ? "We need a few details before you can continue." : "Update your personal details."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              {error}
            </div>
          )}

          {user?.role === "customer" ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="complete-first-name" className="label">First Name</label>
                <input id="complete-first-name" type="text" className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="complete-last-name" className="label">Last Name</label>
                <input id="complete-last-name" type="text" className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
          ) : (
            <>
              <div>
                <label htmlFor="complete-business-name" className="label">Business Name</label>
                <input id="complete-business-name" type="text" className="input" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="complete-address" className="label">Store Address</label>
                <input id="complete-address" type="text" className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
              </div>
            </>
          )}

          <div>
            <label htmlFor="complete-phone" className="label">Phone Number</label>
            <input id="complete-phone" type="tel" className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          </div>

          <button
            type="submit"
            disabled={updateProfile.isPending || (user?.role === "customer" ? (!firstName || !lastName || !phone) : (!businessName || !address || !phone))}
            className="btn-primary mt-2 w-full flex items-center justify-center gap-2"
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save details"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
