import dotenv from 'dotenv';

dotenv.config();

export const config = Object.freeze({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/eleva_db',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  isDevelopment: (process.env.NODE_ENV || 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || 'default_access_secret_change_in_prod',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '30m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  }),
});
