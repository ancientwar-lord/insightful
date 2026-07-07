'use client';

import { useState, useActionState } from 'react';
import { signup, login } from '@/app/lib/actions/auth.actions';

export function useAuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Server action automatically switches between signup & login
  const [state, action, pending] = useActionState(isSignUp ? signup : login, undefined);

  // Normalized errors for easy rendering
  const errors = state?.errors as Record<string, string[] | undefined> | undefined;

  return {
    isSignUp,
    setIsSignUp,
    showPassword,
    setShowPassword,
    state,
    action,
    pending,
    errors,
  };
}
