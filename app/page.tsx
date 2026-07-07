import Link from "next/link";
import PinButton from "./components/PinButton";
import RefreshKeywordNews from "./components/RefreshKeywordNews";
import RefreshSourceNews from "./components/RefreshSourceNews";
import { buildApiUrl } from "./lib/api";
import { getCurrentSession } from "@/app/lib/auth/auth-utils";
import LandingPage from "./components/LandingPage";

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

async function getSources() {
  try {
    const endpointUrl = buildApiUrl('/sources/');
    const res = await fetch(endpointUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch sources");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { sources: [], total: 0 };
  }
}

export default async function Home() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return <LandingPage />;
  }

  const [keywordsData, sourcesData] = await Promise.all([
    getKeywords(),
    getSources()
  ]);

  const pinnedKeywords = (keywordsData.keywords || []).filter((kw: any) => kw.is_pinned);
  const pinnedSources = (sourcesData.sources || []).filter((src: any) => src.is_pinned);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col items-center">
        
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-tight">
            Insightful <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">News</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl leading-relaxed text-zinc-600 dark:text-zinc-400">
            Curated, high-quality articles from top sources. Always fresh, always relevant.
          </p>
        </div>

        <div className="w-full space-y-16 mt-8">
          {/* Pinned Keywords */}
          {pinnedKeywords.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-2">
                <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Pinned Keywords
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pinnedKeywords.map((kw: any) => (
                  <div key={kw.id} className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 capitalize line-clamp-2 break-all" title={kw.keyword}>
                          {kw.keyword}
                        </h3>
                      </div>
                      <PinButton id={kw.id} type="keyword" initialIsPinned={kw.is_pinned} />
                    </div>
                    
                    <div className="mt-auto pt-6 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Link href={`/keywords/${kw.id}`} className="flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10">
                          View History
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                      <div className="w-full relative z-10">
                        <RefreshKeywordNews keyword={kw.keyword} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Pinned Sources */}
          {pinnedSources.length > 0 && (
            <section>
              <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-8 flex items-center gap-2">
                <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Pinned Sources
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {pinnedSources.map((src: any) => (
                  <div key={src.id} className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 capitalize line-clamp-1 break-all" title={src.name}>
                          {src.name}
                        </h3>
                      </div>
                      <PinButton id={src.id} type="source" initialIsPinned={src.is_pinned} />
                    </div>
                    
                    <div className="mt-auto pt-6 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm font-medium text-blue-600 dark:text-blue-400">
                        <Link href={`/sources/${src.id}/articles`} className="flex items-center gap-1 group-hover:translate-x-1 transition-transform relative z-10">
                          View Articles
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                        <Link href={`/sources/${src.id}/history`} className="text-zinc-500 hover:text-blue-600 dark:text-zinc-500 dark:hover:text-blue-400 flex items-center gap-1 transition-colors relative z-10">
                          History
                        </Link>
                      </div>
                      
                      <div className="w-full relative z-10">
                        <RefreshSourceNews sourceSlug={src.source_slug || src.name.toLowerCase().replace(/\s+/g, '-')} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pinnedKeywords.length === 0 && pinnedSources.length === 0 && (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No pinned items found.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Go to the Keywords or Sources page to pin items here.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
