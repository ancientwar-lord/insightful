import Link from "next/link";
import RefreshKeywordNews from "../components/RefreshKeywordNews";
import RefreshNews from "../components/RefreshNews";
import PinButton from "../components/PinButton";
import EditKeywordModal from "../components/EditKeywordModal";
import DeleteKeywordButton from "../components/DeleteKeywordButton";

import { buildApiUrl } from "../lib/api";

export const dynamic = "force-dynamic";

async function getKeywords() {
  try {
    const endpointUrl = buildApiUrl('/keywords/');

    const res = await fetch(endpointUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch keywords");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { keywords: [], total: 0 };
  }
}

function KeywordCard({ kw }: { kw: any }) {
  return (
    <div className="relative group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden min-h-[160px]">
      
      {/* Background Icon */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 text-blue-500/5 dark:text-blue-500/10 z-0 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>

      <Link href={`/keywords/${kw.id}`} className="absolute inset-0 z-0" aria-label={`View history for ${kw.keyword}`} />

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="mb-auto">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 capitalize line-clamp-2 break-all" title={kw.keyword}>
            {kw.keyword}
          </h3>
          {kw.exclude_domains && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">Excludes: {kw.exclude_domains}</p>
          )}
          {kw.advanced_query && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">Advanced: {kw.advanced_query}</p>
          )}
        </div>
        
        <div className="mt-4 pt-4 flex items-center justify-start gap-2 border-t border-zinc-100 dark:border-zinc-800/50 pointer-events-auto">
          <EditKeywordModal keyword={kw} />
          <PinButton id={kw.id} type="keyword" initialIsPinned={kw.is_pinned} />
          <RefreshKeywordNews keyword={kw.keyword} />
          <DeleteKeywordButton id={kw.id} keywordName={kw.keyword} />
        </div>
      </div>
    </div>
  );
}

export default async function KeywordsPage() {
  const data = await getKeywords();
  const keywords = data.keywords || [];

  const pinnedKeywords = keywords.filter((kw: any) => kw.is_pinned);
  const unpinnedKeywords = keywords.filter((kw: any) => !kw.is_pinned);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
            Query <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Keywords</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            Browse through all the tracked search keywords and view their fetch history.
          </p>
        </div>

        <RefreshNews />

        <div className="w-full mt-10 space-y-12">
          {keywords.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No keywords found.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Try refreshing some news to log new keywords.</p>
            </div>
          ) : (
            <>
              {pinnedKeywords.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Pinned Keywords
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {pinnedKeywords.map((kw: any) => (
                      <KeywordCard key={kw.id} kw={kw} />
                    ))}
                  </div>
                </section>
              )}

              {unpinnedKeywords.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                    All Keywords
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {unpinnedKeywords.map((kw: any) => (
                      <KeywordCard key={kw.id} kw={kw} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
