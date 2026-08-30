import "server-only";

export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  adminAuthSecret: process.env.ADMIN_AUTH_SECRET,
  adminPassword: process.env.ADMIN_PASSWORD,
} as const;
