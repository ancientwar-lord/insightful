"use client";

import { useState, useEffect, useCallback } from "react";
import NewsCard from "../components/NewsCard";
import Link from "next/link";

const TABS = [
  { key: "to_read", label: "To Read", emoji: "📖", color: "blue" },
  { key: "learnings", label: "Learnings", emoji: "💡", color: "amber" },
  { key: "spam", label: "Spam", emoji: "🚫", color: "orange" },
  { key: "favourite", label: "Favourites", emoji: "❤️", color: "red" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ActionWithArticle {
  id: number;
  article_id: number;
  action_type: string;
  description: string | null;
  created_at: string;
  article: {
    id: number;
    title: string;
    description: string | null;
    url: string;
    url_to_image: string | null;
    published_at: string;
    content: string | null;
    source_name: string;
    keyword: string | null;
  };
}

function getApiBaseUrl(): string {
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelUrl) {
    return `https://${vercelUrl}/agent`;
  }
  return process.env.NEXT_PUBLIC_LOCAL_ENDPOINT || "http://127.0.0.1:8000";
}

export default function CollectionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("to_read");
  const [data, setData] = useState<{ actions: ActionWithArticle[]; total: number }>({
    actions: [],
    total: 0,
  });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 21;

  const fetchActions = useCallback(async (type: string, pg: number) => {
    setLoading(true);
    try {
      const skip = (pg - 1) * limit;
      const baseUrl = getApiBaseUrl();
      const res = await fetch(
        `${baseUrl}/actions/?type=${type}&skip=${skip}&limit=${limit}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const json = await res.json();
        setData({ actions: json.actions || [], total: json.total || 0 });
      } else {
        setData({ actions: [], total: 0 });
      }
    } catch {
      setData({ actions: [], total: 0 });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchActions(activeTab, page);
  }, [activeTab, page, fetchActions]);

  const totalPages = Math.ceil(data.total / limit);

  // Fetch all actions for each article (to show button states correctly)
  const [articleActionsMap, setArticleActionsMap] = useState<Record<number, any[]>>({});

  useEffect(() => {
    const fetchAllActions = async () => {
      const map: Record<number, any[]> = {};
      const baseUrl = getApiBaseUrl();
      await Promise.all(
        data.actions.map(async (action) => {
          try {
            const res = await fetch(
              `${baseUrl}/actions/article/${action.article_id}`,
              { cache: "no-store" }
            );
            if (res.ok) {
              const json = await res.json();
              map[action.article_id] = json.actions || [];
            }
          } catch {
            map[action.article_id] = [];
          }
        })
      );
      setArticleActionsMap(map);
    };
    if (data.actions.length > 0) {
      fetchAllActions();
    } else {
      setArticleActionsMap({});
    }
  }, [data.actions]);

  const activeTabConfig = TABS.find((t) => t.key === activeTab)!;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
            My{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
              Collections
            </span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            View your curated articles — bookmarks, learnings, and more.
          </p>
        </div>

        {/* ─── Tabs ────────────────────────────────────────────────── */}
        <div className="w-full flex items-center justify-center mb-10">
          <div className="inline-flex bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-1.5 shadow-sm">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r from-${tab.color}-500/10 to-${tab.color}-600/10 text-${tab.color}-600 dark:text-${tab.color}-400 shadow-sm`
                      : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  <span className="text-base">{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Count ───────────────────────────────────────────────── */}
        {data.total > 0 && (
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/50 inline-block px-4 py-1.5 rounded-full mb-8">
            {data.total} article{data.total !== 1 ? "s" : ""} in {activeTabConfig.label}
          </p>
        )}

        {/* ─── Content ─────────────────────────────────────────────── */}
        <div className="w-full">
          {loading ? (
            <div className="text-center py-24">
              <div className="inline-flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Loading...
              </div>
            </div>
          ) : data.actions.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <span className="text-4xl mb-4 block">{activeTabConfig.emoji}</span>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">
                No articles in {activeTabConfig.label}.
              </p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">
                Mark articles from the{" "}
                <Link href="/news" className="text-blue-600 dark:text-blue-400 hover:underline">
                  News page
                </Link>{" "}
                to see them here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {data.actions.map((action) => (
                <NewsCard
                  key={action.id}
                  article={action.article}
                  actions={articleActionsMap[action.article_id] || [{ id: action.id, action_type: action.action_type, description: action.description }]}
                  showDescription={action.description}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── Pagination ──────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-4">
            {page > 1 ? (
              <button
                onClick={() => setPage(page - 1)}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                Previous
              </button>
            ) : (
              <span className="px-6 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                Previous
              </span>
            )}

            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <button
                onClick={() => setPage(page + 1)}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                Next
              </button>
            ) : (
              <span className="px-6 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                Next
              </span>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
