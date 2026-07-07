import { z } from 'zod';
import { APIError } from 'better-auth/api';
import type { ActionResponse } from '@/app/lib/types/common.types';
import { logger } from './logger';

export class AppError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, code?: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

// Normalize known errors into safe, user-facing responses.
export function normalizeAuthError(error: unknown): ActionResponse {
  // Handle schema validation failures.
  if (error instanceof z.ZodError) {
    const fieldErrors = error.flatten().fieldErrors;
    return {
      success: false,
      errors: fieldErrors as Record<string, string[] | undefined>,
      message: 'There are errors in the form.',
    };
  }

  // Handle auth library-specific errors.
  if (error instanceof APIError) {
    logger.warn('Better-Auth APIError', {
      status: error.status,
      message: error.message,
    });
    const msg =
      error.status === 422
        ? 'Email already exists or invalid data.'
        : error.status === 401
          ? 'Invalid email or password.'
          : error.message || 'Auth error occurred.';
    return { success: false, message: msg };
  }

  // Handle application-level errors.
  if (error instanceof AppError) {
    return { success: false, message: error.message };
  }

  // Fallback for unexpected errors.
  logger.error('Unexpected auth error', {
    error: error instanceof Error ? error.message : String(error),
  });
  return { success: false, message: 'Something went wrong. Please try again.' };
}
