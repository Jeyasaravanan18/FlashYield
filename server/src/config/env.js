import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "staging", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  // MongoDB
  MONGODB_URI: z.string().url().min(1),
  // Redis
  REDIS_URL: z.string().min(1),
  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  JWT_ACCESS_EXPIRY: z.string().default("15m"),
  JWT_REFRESH_EXPIRY: z.string().default("7d"),
  // CORS
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  // Google OAuth (optional until Google sign-in is enabled)
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Email / OTP delivery
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.string().optional().transform((val) => val === "true" || val === "1"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().email().optional(),
  SMTP_FORCE_IPV4: z.string().optional().transform((val) => val !== "false" && val !== "0"),
  // OpenRouter chat assistant (optional, falls back to local replies if not set)
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("nvidia/nemotron-3-ultra-550b-a55b:free"),
  // Cloudinary (optional — stub mode if not set)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  // Sentry (optional)
  SENTRY_DSN_SERVER: z.string().optional(),
  // Rate Limiting
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(5),
  RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(6e4),
  RATE_LIMIT_CLAIM_MAX: z.coerce.number().int().positive().default(10),
  RATE_LIMIT_CLAIM_WINDOW_MS: z.coerce.number().int().positive().default(6e4),
  RATE_LIMIT_GENERAL_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_GENERAL_WINDOW_MS: z.coerce.number().int().positive().default(6e4)
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error("\u274C Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}
const env = parsed.data;
export {
  env
};
