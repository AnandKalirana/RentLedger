import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url(),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),
  COOKIE_SECRET: z.string().min(16, "COOKIE_SECRET must be at least 16 characters"),

  STORAGE_DRIVER: z.enum(["local", "supabase"]).default("local"),
  LOCAL_UPLOAD_DIR: z.string().default("uploads"),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().default("uploads"),

  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // RAG / LLM Providers
  EMBEDDING_PROVIDER: z.enum(["gemini", "ollama", "mock"]).default("mock"),
  LLM_PROVIDER: z.enum(["gemini", "ollama", "mock"]).default("mock"),
  EMBEDDING_DIM: z.coerce.number().default(768),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_EMBED_MODEL: z.string().default("text-embedding-004"),
  GEMINI_CHAT_MODEL: z.string().default("gemini-2.0-flash-lite"),
  OLLAMA_BASE_URL: z.string().default("http://localhost:11434"),
  OLLAMA_EMBED_MODEL: z.string().default("nomic-embed-text"),
  OLLAMA_CHAT_MODEL: z.string().default("llama3.2"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === "production";