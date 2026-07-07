'use client';

import { useAuthForm } from '@/app/lib/hooks/use.auth.form';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { authClient } from '@/app/lib/auth/auth-client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthForm() {
  const { isSignUp, setIsSignUp, showPassword, setShowPassword, state, action, pending, errors } =
    useAuthForm();
  const router = useRouter();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await authClient.signIn.anonymous({
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
            router.refresh();
          },
          onError: (ctx) => {
            console.error(ctx.error.message);
            alert(ctx.error.message || 'Failed to login as guest.');
          }
        }
      });
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred.');
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800">
        <h2 className="text-3xl font-extrabold text-center mb-2 text-zinc-900 dark:text-zinc-50 tracking-tight">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-center text-zinc-500 dark:text-zinc-400 mb-6">
          {isSignUp ? 'Join Insightful News now' : 'Sign in to continue to your dashboard'}
        </p>

        {state?.message && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-6 text-sm font-medium">
            {state.message}
          </div>
        )}

        <form action={action} className="flex flex-col gap-5">
          {isSignUp && (
            <div>
              <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
                placeholder="Your name"
              />
              {errors?.name && <p className="text-rose-500 text-sm mt-2 font-medium">{errors.name}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              placeholder="you@example.com"
            />
            {errors?.email && <p className="text-rose-500 text-sm mt-2 font-medium">{errors.email}</p>}
          </div>

          <div className="relative">
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              className="w-full p-3 pr-10 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute cursor-pointer top-9 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>

            {errors?.password && (
              <div className="text-rose-500 text-sm mt-2 font-medium">
                <p>Password must:</p>
                <ul className="pl-6 mt-1">
                  {errors.password.map((error: string) => (
                    <li key={error} className="list-disc">
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pending || isGuestLoading}
            className={`w-full py-3 rounded-2xl font-bold text-white transition ${
              pending || isGuestLoading
                ? 'bg-zinc-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 cursor-pointer shadow-lg hover:shadow-blue-500/20'
            } disabled:opacity-70`}
          >
            {pending ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-zinc-900 px-3 text-zinc-500 dark:text-zinc-400 font-medium">Or</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGuestLogin}
          disabled={pending || isGuestLoading}
          className="w-full py-3 rounded-2xl font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isGuestLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
              <span>Logging in...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>Continue as Guest</span>
            </>
          )}
        </button>

        <p className="text-center mt-6 text-zinc-500 dark:text-zinc-400 text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 dark:text-blue-400 hover:underline bg-transparent border-none cursor-pointer font-bold transition-all"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}
