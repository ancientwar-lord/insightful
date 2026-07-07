'use server';

import {
  signupSchema,
  loginSchema,
  type SignupInput,
  type LoginInput,
} from '@/app/lib/schemas/auth.schema';
import type { ActionResponse } from '@/app/lib/types/common.types';
import { auth } from '@/app/lib/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { normalizeAuthError } from '@/app/lib/errors';

// Server action: create account and redirect into the app.
export async function signup(
  _state: ActionResponse<SignupInput> | undefined,
  formData: FormData
): Promise<ActionResponse<SignupInput>> {
  // Ensure the submitted form matches the expected shape.
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData));

  // Short-circuit on validation failure so the UI can show errors.
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the errors in the form.',
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    // Create the user via the shared auth service.
    await auth.api.signUpEmail({
      headers: await headers(),
      body: { name, email, password },
    });
  } catch (error) {
    // Normalize errors so internal details are not leaked to the client.
    const normalized = normalizeAuthError(error);
    return {
      success: false,
      message: normalized?.message || 'An error occurred while creating your account.',
    };
  }

  // Redirect into the app after successful signup.
  redirect('/');
}

// Server action: authenticate and redirect into the app.
export async function login(
  _state: ActionResponse<LoginInput> | undefined,
  formData: FormData
): Promise<ActionResponse<LoginInput>> {
  // Ensure the submitted form matches the expected shape.
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData));

  // Short-circuit on validation failure so the UI can show errors.
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Invalid input.',
    };
  }

  const { email, password } = validatedFields.data;

  try {
    // Authenticate via the shared auth service.
    await auth.api.signInEmail({
      headers: await headers(),
      body: { email, password },
    });
  } catch (error) {
    // Normalize errors so internal details are not leaked to the client.
    const normalized = normalizeAuthError(error);
    return {
      success: false,
      message: normalized?.message || 'Invalid email or password.',
    };
  }

  // Redirect into the app after successful login.
  redirect('/');
}
