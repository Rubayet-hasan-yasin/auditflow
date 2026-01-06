import { config } from 'dotenv';
import * as process from 'process';
import type { StringValue } from 'ms';

config({ path: '.env' });

export const Env = {
  // App config
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),

  // Database config
  DATABASE_PATH: process.env.DATABASE_PATH || './data/auditflow.db',

  // JWT config
  JWT_SECRET:
    process.env.JWT_SECRET || 'auditflow-secret-key-change-in-production',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '24h') as StringValue,

  // Bcrypt
  SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS || '10', 10),
};
