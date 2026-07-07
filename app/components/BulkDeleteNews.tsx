"use client";

import { useState, useTransition, useEffect } from "react";
import { bulkDeleteNews } from "@/app/lib/actions";

interface BulkDeleteNewsProps {
  keywords: { id: number; label: string }[];
  sources: { id: number; label: string }[];
  initialSelectedKeywords?: number[];
  initialSelectedSources?: number[];
  initialSearchQuery?: string;
}

export default function BulkDeleteNews({
  keywords,
  sources,
  initialSelectedKeywords = [],
  initialSelectedSources = [],
  initialSearchQuery = "",
}: BulkDeleteNewsProps) {
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>(initialSelectedKeywords);
  const [selectedSourceIds, setSelectedSourceIds] = useState<number[]>(initialSelectedSources);
  const [deleteSearch, setDeleteSearch] = useState<boolean>(!!initialSearchQuery);
  const [isPending, startTransition] = useTransition();

  // Sync state with parent filters changes
  useEffect(() => {
    setSelectedKeywordIds(initialSelectedKeywords);
  }, [initialSelectedKeywords]);

  useEffect(() => {
    setSelectedSourceIds(initialSelectedSources);
  }, [initialSelectedSources]);

  useEffect(() => {
    setDeleteSearch(!!initialSearchQuery);
  }, [initialSearchQuery]);

  const handleKeywordToggle = (id: number) => {
    setSelectedKeywordIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSourceToggle = (id: number) => {
    setSelectedSourceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    if (
      selectedKeywordIds.length === 0 &&
      selectedSourceIds.length === 0 &&
      (!deleteSearch || !initialSearchQuery)
    ) {
      alert("Please select at least one keyword, source, or search term for deletion.");
      return;
    }

    const itemsToDelete: string[] = [];
    if (selectedKeywordIds.length > 0) {
      itemsToDelete.push(`${selectedKeywordIds.length} keyword(s)`);
    }
    if (selectedSourceIds.length > 0) {
      itemsToDelete.push(`${selectedSourceIds.length} source(s)`);
    }
    if (deleteSearch && initialSearchQuery) {
      itemsToDelete.push(`search query "${initialSearchQuery}"`);
    }

    const warningMessage = `Are you sure you want to delete ALL articles matching: ${itemsToDelete.join(" and ")}? This action cannot be undone.`;

    if (!confirm(warningMessage)) {
      return;
    }

    startTransition(async () => {
      const result = await bulkDeleteNews(
        selectedKeywordIds,
        selectedSourceIds,
        deleteSearch ? initialSearchQuery : undefined
      );

      if (result.success) {
        alert(result.message);
        // Clear local selections after success
        setSelectedKeywordIds([]);
        setSelectedSourceIds([]);
        setDeleteSearch(false);
      } else {
        alert(result.message || "Failed to bulk delete news");
      }
    });
  };

  return (
    <div className="bg-red-50/50 dark:bg-red-950/5 border border-red-200 dark:border-red-900/20 rounded-3xl p-6 space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-red-100 dark:border-red-950 pb-4">
        <div>
          <h3 className="text-xl font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Advanced Bulk Delete
          </h3>
          <p className="text-sm text-red-600 dark:text-red-500 mt-1">
            Choose multiple keywords, sources, or delete search query matching articles.
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={isPending || (selectedKeywordIds.length === 0 && selectedSourceIds.length === 0 && (!deleteSearch || !initialSearchQuery))}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-red-500/20 hover:shadow-red-500/35 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 self-start md:self-auto"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Deleting Articles...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Selected
            </>
          )}
        </button>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keywords column */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 border border-red-100 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Keywords</span>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedKeywordIds(keywords.map((k) => k.id))}
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                Select All
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={() => setSelectedKeywordIds([])}
                className="text-zinc-500 hover:underline font-medium"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {keywords.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 py-4 text-center">No keywords available</p>
            ) : (
              keywords.map((kw) => (
                <label
                  key={`del-kw-${kw.id}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedKeywordIds.includes(kw.id)}
                    onChange={() => handleKeywordToggle(kw.id)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500 bg-white dark:bg-zinc-800"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize truncate">
                    {kw.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Sources column */}
        <div className="flex flex-col bg-white dark:bg-zinc-900 border border-red-100 dark:border-zinc-800 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3 border-b border-zinc-100 dark:border-zinc-800/50 pb-2">
            <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Sources</span>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedSourceIds(sources.map((s) => s.id))}
                className="text-violet-600 dark:text-violet-400 hover:underline font-medium"
              >
                Select All
              </button>
              <span className="text-zinc-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={() => setSelectedSourceIds([])}
                className="text-zinc-500 hover:underline font-medium"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {sources.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-600 py-4 text-center">No sources available</p>
            ) : (
              sources.map((src) => (
                <label
                  key={`del-src-${src.id}`}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                >
                  <input
                    type="checkbox"
                    checked={selectedSourceIds.includes(src.id)}
                    onChange={() => handleSourceToggle(src.id)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-red-600 focus:ring-red-500 bg-white dark:bg-zinc-800"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize truncate">
                    {src.label}
                  </span>
                </label>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Search results delete option */}
      {initialSearchQuery && (
        <div className="bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/25 rounded-2xl p-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="delete-search-checkbox"
            checked={deleteSearch}
            onChange={(e) => setDeleteSearch(e.target.checked)}
            className="w-5 h-5 rounded border-amber-300 dark:border-amber-700 text-amber-600 focus:ring-amber-500 bg-white dark:bg-zinc-900 cursor-pointer"
          />
          <label htmlFor="delete-search-checkbox" className="text-sm font-medium text-amber-800 dark:text-amber-400 cursor-pointer select-none">
            Delete all articles matching search query: <span className="font-bold underline">"{initialSearchQuery}"</span>
          </label>
        </div>
      )}
    </div>
  );
}
