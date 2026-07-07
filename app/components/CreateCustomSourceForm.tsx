"use client";

import { useState, useTransition } from "react";
import { createCustomSource } from "@/app/lib/actions";

export default function CreateCustomSourceForm() {
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
      const result = await createCustomSource(formData);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      
      if (result.success) {
        (e.target as HTMLFormElement).reset();
      }

      setTimeout(() => {
        setMessage(null);
      }, 5000);
    });
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-sm mb-12">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Custom Source
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">
          Create a virtual source containing multiple domains or sources. You can paste comma-separated domains (e.g. <code>venturebeat.com,dev.to</code>) or a full NewsAPI URL.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 w-full">
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Source Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            placeholder="e.g. Tech Blogs"
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="flex-[2] w-full">
          <label htmlFor="source_slug" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
            Domains / API URL
          </label>
          <input
            type="text"
            id="source_slug"
            name="source_slug"
            required
            placeholder="e.g. venturebeat.com, hackernoon.com"
            className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-zinc-900 dark:text-zinc-100"
          />
        </div>

        <div className="w-full md:w-auto md:self-end">
          <button
            type="submit"
            disabled={isPending}
            className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              "Create Source"
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
  );
}
