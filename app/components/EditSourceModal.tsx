"use client";

import { useState, useTransition } from "react";
import { updateCustomSource } from "@/app/lib/actions";

export default function EditSourceModal({ source }: { source: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const rawInput = formData.get("source_slug")?.toString() || "";

    // If user pastes a URL, extract the domains parameter
    if (rawInput.includes("domains=")) {
      try {
        const urlObj = new URL(rawInput);
        const domains = urlObj.searchParams.get("domains");
        if (domains) {
          formData.set("source_slug", domains);
        }
      } catch (err) {
        // Not a valid URL, just use raw input
      }
    } else if (rawInput.includes("sources=")) {
      try {
        const urlObj = new URL(rawInput);
        const sources = urlObj.searchParams.get("sources");
        if (sources) {
          formData.set("source_slug", sources);
        }
      } catch (err) {
        // Not a valid URL, just use raw input
      }
    }

    startTransition(async () => {
      const result = await updateCustomSource(source.id, formData);
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
        title="Edit Source"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 max-w-md w-full border border-zinc-200 dark:border-zinc-800 shadow-2xl relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Edit Source</h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Source Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={source.name}
                  required
                  className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label htmlFor="source_slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Domains / API URL
                </label>
                <input
                  type="text"
                  id="source_slug"
                  name="source_slug"
                  defaultValue={source.source_slug || ""}
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
                  defaultValue={source.advanced_query || ""}
                  placeholder='e.g. +bitcoin OR -sports'
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
