"use client";

import { useState, useTransition } from "react";
import { triggerSourceNewsRefresh } from "@/app/lib/actions";

export default function RefreshSourceNews({ sourceSlug }: { sourceSlug: string }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const handleRefresh = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sourceSlug) return;
    
    startTransition(async () => {
      const result = await triggerSourceNewsRefresh(sourceSlug);
      setMessage(result.message);
      
      // Auto-hide the message after 5 seconds
      setTimeout(() => {
        setMessage(null);
      }, 5000);
    });
  };

  return (
    <div className="flex flex-col relative" onClick={(e) => e.preventDefault()}>
      <button
        onClick={handleRefresh}
        disabled={isPending}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        title="Refresh Source"
      >
        {isPending ? (
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
      </button>
      
      {message && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-10 px-3 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs rounded-lg shadow-lg max-w-[200px] text-center w-max animate-in fade-in zoom-in-95 duration-200">
          {message}
        </div>
      )}
    </div>
  );
}
