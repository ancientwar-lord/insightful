import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { nextCookies } from 'better-auth/next-js';
import { anonymous } from 'better-auth/plugins';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

export const auth = betterAuth({
  database: new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  }),
  user: { modelName: 'users' },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
    cookieCache: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      enabled: true,
      maxAge: 5 * 60,
      httpOnly: true,
    },
  },
  rateLimit: {
    enabled: process.env.NODE_ENV === 'production',
    window: 60,
    max: 100,
    storage: 'database',
    modelName: 'rateLimit',
    customRules: {
      '/sign-in/email': { window: 10, max: 5 },
      '/sign-up/email': { window: 10, max: 5 },
      '/sign-in': { window: 10, max: 5 },
      '/get-session': false,
    },
  },
  baseURL: (() => {
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
    }
    return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
  })(),
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    (() => {
      if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
        return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
      }
      return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    })()
  ],
  plugins: [nextCookies(), anonymous()],
  experimental: { joins: true },
});
