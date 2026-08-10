const USER_ROLES = ["customer", "merchant", "admin"];
const LISTING_STATUSES = ["draft", "scheduled", "active", "sold_out", "expired", "cancelled"];
const CLAIM_STATUSES = ["reserved", "collected", "expired", "cancelled"];
const MERCHANT_VERIFICATION_STATUSES = ["pending", "approved", "suspended"];
const AUDIT_ACTIONS = [
  "token_verification_success",
  "token_verification_failure",
  "listing_created",
  "listing_updated",
  "listing_cancelled",
  "claim_created",
  "claim_cancelled",
  "merchant_approved",
  "merchant_suspended",
  "listing_moderated",
  "user_login",
  "user_register"
];
export {
  AUDIT_ACTIONS,
  CLAIM_STATUSES,
  LISTING_STATUSES,
  MERCHANT_VERIFICATION_STATUSES,
  USER_ROLES
};
