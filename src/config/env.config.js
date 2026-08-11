import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Define Zod schema for environment variables
const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string({ required_error: 'DATABASE_URL environment variable is required' }).min(1),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string({ required_error: 'JWT_SECRET is required' }).min(10),
  JWT_REFRESH_SECRET: z.string({ required_error: 'JWT_REFRESH_SECRET is required' }).min(10),
  JWT_EXPIRES_IN: z.string().default('30m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // The FastAPI analysis service. It has no auth of its own, so it must never
  // be reachable from the browser — every call to it goes through this API.
  // Trailing slashes are stripped so paths can always be joined with a leading one.
  AGENT_SERVER_URL: z
    .string()
    .url('AGENT_SERVER_URL must be a valid URL')
    .default('http://127.0.0.1:8000')
    .transform((val) => val.replace(/\/+$/, '')),
  // Shared secret for the agent server handshake, sent as X-Internal-Key.
  // Optional here on purpose: a missing key must not stop auth, transactions and
  // vendors from booting. Only the findings endpoints depend on it, and they
  // report the reason themselves — see clients/agent.client.js.
  AGENT_SERVER_KEY: z.string().optional(),
});

// Validate process.env against schema
const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('❌ Invalid environment variable configuration:');
  parseResult.error.issues.forEach((issue) => {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  });
  process.exit(1);
}

const env = parseResult.data;

export const config = Object.freeze({
  port: env.PORT,
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  frontendUrl: env.FRONTEND_URL,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
  agentServerUrl: env.AGENT_SERVER_URL,
  agentServerKey: env.AGENT_SERVER_KEY,
  jwt: Object.freeze({
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  }),
});

