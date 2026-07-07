import type { auth } from '@/app/lib/auth/auth';

// Infer the session type from the auth configuration.
export type Session = typeof auth.$Infer.Session;

// Data Transfer Object for user information sent from server to client.
export type UserDTO = {
  id: string;
  name: string | null;
  email: string;
};

// Client-side user type, which can be null when not authenticated.
export type ClientUser = {
  id: string;
  name: string;
  email: string;
} | null;
