import 'server-only';
import { headers } from 'next/headers';
import { auth } from '@/app/lib/auth/auth';
import { redirect } from 'next/navigation';
import type { Session } from '@/app/lib/types/auth.types';
import { cache } from 'react'; // Cache DAL calls per render to avoid duplicate fetches.

// Data Access Layer (DAL) helper.
// Cache this call within a render to avoid redundant network/DB work.
export const getCurrentSession = cache(async () => {
  const requestHeaders = await headers();
  return auth.api.getSession({ headers: requestHeaders });
});

export async function requireSession() {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

// Data Transfer Object (DTO) helper.
// Expose only safe user fields to the client.

export function getUserDTO(user: Session['user'] | undefined | null) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
