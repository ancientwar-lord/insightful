"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BulkDeleteNews from "./BulkDeleteNews";

interface FilterOption {
  id: number;
  label: string;
}

interface NewsFiltersProps {
  keywords: FilterOption[];
  sources: FilterOption[];
  totalArticles?: number;
}

export default function NewsFilters({ keywords, sources, totalArticles = 0 }: NewsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parse current filters from URL
  const currentKeywordIds = searchParams.get("keyword_ids")?.split(",").map(Number).filter(Boolean) || [];
  const currentSourceIds = searchParams.get("source_ids")?.split(",").map(Number).filter(Boolean) || [];
  const currentDate = searchParams.get("date") || "";
  const currentSearch = searchParams.get("search") || "";

  const [selectedKeywords, setSelectedKeywords] = useState<number[]>(currentKeywordIds);
  const [selectedSources, setSelectedSources] = useState<number[]>(currentSourceIds);
  const [selectedDate, setSelectedDate] = useState(currentDate);
  const [searchQuery, setSearchQuery] = useState(currentSearch);
  const [keywordDropdownOpen, setKeywordDropdownOpen] = useState(false);
  const [sourceDropdownOpen, setSourceDropdownOpen] = useState(false);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  const keywordRef = useRef<HTMLDivElement>(null);
  const sourceRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (keywordRef.current && !keywordRef.current.contains(e.target as Node)) {
        setKeywordDropdownOpen(false);
      }
      if (sourceRef.current && !sourceRef.current.contains(e.target as Node)) {
        setSourceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (selectedKeywords.length > 0) params.set("keyword_ids", selectedKeywords.join(","));
    if (selectedSources.length > 0) params.set("source_ids", selectedSources.join(","));
    if (selectedDate) params.set("date", selectedDate);
    if (searchQuery) params.set("search", searchQuery);
    params.set("page", "1"); // Reset to page 1
    router.push(`/news?${params.toString()}`);
  };

  const clearAll = () => {
    setSelectedKeywords([]);
    setSelectedSources([]);
    setSelectedDate("");
    setSearchQuery("");
    router.push("/news");
  };

  const hasActiveFilters = selectedKeywords.length > 0 || selectedSources.length > 0 || selectedDate || searchQuery;

  const toggleKeyword = (id: number) => {
    setSelectedKeywords((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSource = (id: number) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllKeywords = () => setSelectedKeywords(keywords.map((k) => k.id));
  const deselectAllKeywords = () => setSelectedKeywords([]);
  const selectAllSources = () => setSelectedSources(sources.map((s) => s.id));
  const deselectAllSources = () => setSelectedSources([]);

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </h3>
          {totalArticles > 0 && (
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
              Showing {totalArticles} total news articles
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium text-red-500 hover:text-red-600 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-start">
        {/* Keywords Dropdown */}
        {keywords.length > 0 && (
          <div ref={keywordRef} className="relative">
            <button
              onClick={() => {
                setKeywordDropdownOpen(!keywordDropdownOpen);
                setSourceDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                selectedKeywords.length > 0
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Keywords
              {selectedKeywords.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {selectedKeywords.length}
                </span>
              )}
              <svg className={`w-3.5 h-3.5 transition-transform ${keywordDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {keywordDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Select/Deselect All */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Keywords</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllKeywords} className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium">
                      Select All
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <button onClick={deselectAllKeywords} className="text-xs text-zinc-500 hover:underline font-medium">
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {keywords.map((kw) => (
                    <label
                      key={kw.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedKeywords.includes(kw.id)}
                        onChange={() => toggleKeyword(kw.id)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-blue-600 focus:ring-blue-500 dark:bg-zinc-700"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize truncate">
                        {kw.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sources Dropdown */}
        {sources.length > 0 && (
          <div ref={sourceRef} className="relative">
            <button
              onClick={() => {
                setSourceDropdownOpen(!sourceDropdownOpen);
                setKeywordDropdownOpen(false);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                selectedSources.length > 0
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300"
                  : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Sources
              {selectedSources.length > 0 && (
                <span className="bg-violet-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {selectedSources.length}
                </span>
              )}
              <svg className={`w-3.5 h-3.5 transition-transform ${sourceDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {sourceDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">Sources</span>
                  <div className="flex gap-2">
                    <button onClick={selectAllSources} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
                      Select All
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-600">|</span>
                    <button onClick={deselectAllSources} className="text-xs text-zinc-500 hover:underline font-medium">
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {sources.map((src) => (
                    <label
                      key={src.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.includes(src.id)}
                        onChange={() => toggleSource(src.id)}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 text-violet-600 focus:ring-violet-500 dark:bg-zinc-700"
                      />
                      <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize truncate">
                        {src.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date Selector */}
        <div className="relative">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer bg-transparent ${
              selectedDate
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          />
        </div>

        {/* Title Search Input */}
        <div className="relative flex-grow sm:flex-grow-0 min-w-[200px]">
          <input
            type="text"
            placeholder="Search news title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFilters();
            }}
            className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium transition-all bg-transparent focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none ${
              searchQuery
                ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300"
                : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600"
            }`}
          />
        </div>

        {/* Apply Button */}
        <button
          onClick={applyFilters}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg shadow-blue-500/25"
        >
          Apply
        </button>

        {/* Bulk Delete Toggle Button */}
        <button 
          onClick={() => setShowBulkDelete(!showBulkDelete)}
          className={`p-2.5 rounded-xl border text-sm font-medium transition-all flex items-center justify-center ${
            showBulkDelete 
              ? "border-red-500 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300" 
              : "border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          }`}
          title="Toggle Bulk Delete"
        >
          <svg className={`w-5 h-5 transition-transform ${showBulkDelete ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 pt-2">
          {selectedKeywords.map((id) => {
            const kw = keywords.find((k) => k.id === id);
            return kw ? (
              <span
                key={`kw-${id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300"
              >
                {kw.label}
                <button
                  onClick={() => toggleKeyword(id)}
                  className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ) : null;
          })}
          {selectedSources.map((id) => {
            const src = sources.find((s) => s.id === id);
            return src ? (
              <span
                key={`src-${id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300"
              >
                {src.label}
                <button
                  onClick={() => toggleSource(id)}
                  className="hover:text-violet-900 dark:hover:text-violet-100 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ) : null;
          })}
          {selectedDate && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              {selectedDate}
              <button
                onClick={() => setSelectedDate("")}
                className="hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Search: "{searchQuery}"
              <button
                onClick={() => {
                  setSearchQuery("");
                  const params = new URLSearchParams(searchParams.toString());
                  params.delete("search");
                  params.set("page", "1");
                  router.push(`/news?${params.toString()}`);
                }}
                className="hover:text-amber-900 dark:hover:text-amber-100 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          )}
        </div>
      )}

      {/* Bulk Delete Section */}
      {showBulkDelete && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 animate-in fade-in slide-in-from-top-4">
          <BulkDeleteNews 
            keywords={keywords} 
            sources={sources} 
            initialSelectedKeywords={selectedKeywords}
            initialSelectedSources={selectedSources}
            initialSearchQuery={searchQuery}
          />
        </div>
      )}
    </div>
  );
}
