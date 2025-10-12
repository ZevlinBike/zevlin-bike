import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY: z.string().min(1),

  // Shippo + app
  SHIPPO_API_TOKEN: z.string().min(1, "Missing SHIPPO_API_TOKEN"),
  SHIPPO_TEST_API_TOKEN: z.string().min(1).optional(),
  // Optional for non-webhook flows; webhook route enforces presence
  APP_URL: z.string().url().optional().describe("Base URL for webhook targets"),
  SHIPPO_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .optional()
    .describe("Shared secret to validate Shippo webhooks"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_TEST_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  BREVO_API_KEY: z.string().min(1),
  BREVO_SENDER_EMAIL: z.string().email(),
  BREVO_SENDER_NAME: z.string().min(1),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY,

  SHIPPO_API_TOKEN: process.env.SHIPPO_API_TOKEN,
  SHIPPO_TEST_API_TOKEN: process.env.SHIPPO_TEST_API_TOKEN,
  APP_URL: process.env.APP_URL,
  SHIPPO_WEBHOOK_SECRET: process.env.SHIPPO_WEBHOOK_SECRET,

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_TEST_SECRET_KEY: process.env.STRIPE_TEST_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL,
  BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME,
});

if (!parsed.success) {
  // Keep the error concise and avoid leaking secrets
  const issue = parsed.error.issues[0];
  const path = issue?.path?.join(".") || "env";
  throw new Error(`Invalid environment config: ${path} ${issue.message}`);
}

export const env = parsed.data;
