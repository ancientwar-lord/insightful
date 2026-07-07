"use client";

import { useState, useTransition } from "react";
import { editKeyword } from "@/app/lib/actions";

export default function EditKeywordModal({ keyword }: { keyword: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await editKeyword(keyword.id, formData);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      
      if (result.success) {
        setTimeout(() => {
          setIsOpen(false);
          setMessage(null);
        }, 1500);
      }
    });
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors shrink-0"
        title="Edit Keyword"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Edit Keyword</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Keyword
                </label>
                <input
                  type="text"
                  id="keyword"
                  name="keyword"
                  defaultValue={keyword.keyword}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label htmlFor="advanced_query" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Advanced Query (Optional)
                </label>
                <input
                  type="text"
                  id="advanced_query"
                  name="advanced_query"
                  defaultValue={keyword.advanced_query || ""}
                  placeholder='e.g. +bitcoin OR -crypto'
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              <div>
                <label htmlFor="exclude_domains" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Exclude Domains (Optional)
                </label>
                <input
                  type="text"
                  id="exclude_domains"
                  name="exclude_domains"
                  defaultValue={keyword.exclude_domains || ""}
                  placeholder='e.g. bbc.co.uk, techcrunch.com'
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPending ? (
                    <>
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>

            {message && (
              <div className={`mt-4 p-3 rounded-lg text-sm font-medium animate-in fade-in zoom-in-95 ${
                message.type === 'success' 
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800/50' 
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50'
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
