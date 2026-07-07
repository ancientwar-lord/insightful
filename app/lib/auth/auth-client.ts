'use client';

import { createAuthClient } from 'better-auth/react';
import { anonymousClient } from 'better-auth/client/plugins';

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [anonymousClient()],
});
export const signOut = authClient.signOut;
export const useSession = authClient.useSession;
