"use client";

import { useState, useTransition } from "react";
import { triggerNewsRefresh } from "@/app/lib/actions";

export default function RefreshNews() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const result = await triggerNewsRefresh(formData);
      setMessage(result.message);
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-12 p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-zinc-200 dark:border-zinc-800 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full text-center sm:text-left">
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Keep up with the latest
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Fetch fresh articles from our AI sources.
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative flex-1 sm:w-48">
            <input
              type="text"
              name="query"
              defaultValue="ai"
              placeholder="Topic (e.g. tech, ai)"
              disabled={isPending}
              className="w-full h-11 pl-4 pr-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="relative h-11 px-6 bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 font-medium rounded-xl hover:bg-zinc-800 dark:hover:bg-white active:scale-95 transition-all disabled:opacity-70 disabled:active:scale-100 flex items-center justify-center min-w-[120px]"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing
              </span>
            ) : (
              "Refresh News"
            )}
          </button>
        </form>
      </div>
      
      {message && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-sm text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
          {message}
        </div>
      )}
    </div>
  );
}
