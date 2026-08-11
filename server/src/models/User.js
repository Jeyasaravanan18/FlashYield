import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLES } from "../types.js";
const userSchema = new Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false
      // Never return password hash by default
    },
    googleSubject: {
      type: String,
      default: null
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be one of: customer, merchant, admin"
      },
      required: true,
      default: "customer"
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationCodeHash: {
      type: String,
      default: null,
      select: false
    },
    emailVerificationCodeExpiresAt: {
      type: Date,
      default: null
    },
    passwordResetCodeHash: {
      type: String,
      default: null,
      select: false
    },
    passwordResetCodeExpiresAt: {
      type: Date,
      default: null
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false
      // Never return in normal queries
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    noShowCount: {
      type: Number,
      default: 0
    },
    claimBannedUntil: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        const obj = ret;
        delete obj.passwordHash;
        delete obj.refreshTokenHash;
        delete obj.__v;
        return ret;
      }
    }
  }
);
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};
userSchema.index({ email: 1 }, { unique: true });
userSchema.index(
  { googleSubject: 1 }, 
  { unique: true, partialFilterExpression: { googleSubject: { $type: "string" } } }
);
const User = mongoose.model("User", userSchema);
export {
  User
};
