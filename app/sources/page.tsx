import Link from "next/link";
import RefreshSourceNews from "../components/RefreshSourceNews";
import CreateCustomSourceForm from "../components/CreateCustomSourceForm";
import PinButton from "../components/PinButton";
import EditSourceModal from "../components/EditSourceModal";
import DeleteSourceButton from "../components/DeleteSourceButton";

import { buildApiUrl } from "../lib/api";

export const dynamic = "force-dynamic";

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

function SourceCard({ src }: { src: any }) {
  return (
    <div className="relative group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/10 transition-all duration-300 overflow-hidden min-h-[160px]">
      
      {/* Background Icon */}
      <div className="absolute -bottom-6 -right-6 w-32 h-32 text-violet-500/5 dark:text-violet-500/10 z-0 pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>

      <Link href={`/sources/${src.id}/history`} className="absolute inset-0 z-0" aria-label={`View history for ${src.name}`} />

      <div className="relative z-10 flex flex-col h-full pointer-events-none">
        <div className="mb-auto">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 capitalize line-clamp-2 break-all" title={src.name}>
            {src.name}
          </h3>
          {src.advanced_query && (
            <p className="text-xs text-zinc-500 line-clamp-1 mt-1">Advanced: {src.advanced_query}</p>
          )}
        </div>
        
        <div className="mt-4 pt-4 flex items-center justify-start gap-2 border-t border-zinc-100 dark:border-zinc-800/50 pointer-events-auto">
          <EditSourceModal source={src} />
          <PinButton id={src.id} type="source" initialIsPinned={src.is_pinned} />
          <RefreshSourceNews sourceSlug={src.source_slug || src.name.toLowerCase().replace(/\s+/g, '-')} />
          <DeleteSourceButton id={src.id} sourceName={src.name} />
        </div>
      </div>
    </div>
  );
}

export default async function SourcesPage() {
  const data = await getSources();
  const sources = data.sources || [];
  
  const pinnedSources = sources.filter((src: any) => src.is_pinned);
  const unpinnedSources = sources.filter((src: any) => !src.is_pinned);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
            News <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Sources</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            Browse through all the publishers and outlets we track news from.
          </p>
        </div>

        <CreateCustomSourceForm />

        <div className="w-full mt-10 space-y-12">
          {sources.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No sources found.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Try fetching some news to populate sources.</p>
            </div>
          ) : (
            <>
              {pinnedSources.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                    <svg className="w-6 h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    Pinned Sources
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {pinnedSources.map((src: any) => (
                      <SourceCard key={src.id} src={src} />
                    ))}
                  </div>
                </section>
              )}

              {unpinnedSources.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                    All Sources
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {unpinnedSources.map((src: any) => (
                      <SourceCard key={src.id} src={src} />
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
