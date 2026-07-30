import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config/env.config.js';

const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes('neon.tech') || config.isProduction
    ? { rejectUnauthorized: false }
    : false,
});

export const db = drizzle(pool);
export { pool };
