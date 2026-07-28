import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  userId: string;
  role: 'customer' | 'merchant' | 'admin';
  email: string;
}

// Extend Express Request to include authenticated user and request ID
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      id?: string;
    }
  }
}

export type UserRole = 'customer' | 'merchant' | 'admin';

export const USER_ROLES = ['customer', 'merchant', 'admin'] as const;

export type ListingStatus = 'active' | 'sold_out' | 'expired' | 'cancelled';

export const LISTING_STATUSES = ['active', 'sold_out', 'expired', 'cancelled'] as const;

export type ClaimStatus = 'reserved' | 'collected' | 'expired' | 'cancelled';

export const CLAIM_STATUSES = ['reserved', 'collected', 'expired', 'cancelled'] as const;

export type MerchantVerificationStatus = 'pending' | 'approved' | 'suspended';

export const MERCHANT_VERIFICATION_STATUSES = ['pending', 'approved', 'suspended'] as const;

export type AuditAction =
  | 'token_verification_success'
  | 'token_verification_failure'
  | 'listing_created'
  | 'listing_updated'
  | 'listing_cancelled'
  | 'claim_created'
  | 'claim_cancelled'
  | 'merchant_approved'
  | 'merchant_suspended'
  | 'listing_moderated'
  | 'user_login'
  | 'user_register';

export const AUDIT_ACTIONS = [
  'token_verification_success',
  'token_verification_failure',
  'listing_created',
  'listing_updated',
  'listing_cancelled',
  'claim_created',
  'claim_cancelled',
  'merchant_approved',
  'merchant_suspended',
  'listing_moderated',
  'user_login',
  'user_register',
] as const;

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
