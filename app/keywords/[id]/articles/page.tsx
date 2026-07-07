import Link from "next/link";

import { buildApiUrl } from "../../../lib/api";

export const dynamic = "force-dynamic";

async function getKeywordArticles(id: string) {
  try {
    // Fetch keyword details
    const kwRes = await fetch(buildApiUrl(`/keywords/${id}`), { cache: "no-store" });
    if (!kwRes.ok) throw new Error("Failed to fetch keyword");
    const keyword = await kwRes.json();
    
    // Fetch keyword articles
    const artRes = await fetch(buildApiUrl(`/keywords/${id}/articles`), { cache: "no-store" });
    if (!artRes.ok) throw new Error("Failed to fetch articles");
    const articlesData = await artRes.json();
    
    return { keyword, articlesData };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function KeywordArticlesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getKeywordArticles(resolvedParams.id);
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-xl text-zinc-500">Keyword not found.</p>
      </div>
    );
  }

  const { keyword, articlesData } = data;
  const articles = articlesData.articles || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
          <div className="flex items-center gap-4">
            <Link href={`/keywords/${keyword.id}`} className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
                {keyword.keyword} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">News</span>
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                Articles tracked for this specific query.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full mt-4">
          {articles.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No articles found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article: any) => (
                <a
                  key={article.id}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300"
                >
                  <div className="relative w-full aspect-[16/9] bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    {article.url_to_image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={article.url_to_image} 
                        alt={article.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-400 dark:text-zinc-600">
                        <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-white/90 dark:bg-black/90 backdrop-blur-md text-zinc-900 dark:text-zinc-100 rounded-full shadow-sm">
                        {article.source_name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col flex-1 p-6 sm:p-8">
                    <div className="max-h-64 overflow-y-auto custom-scrollbar mb-6 flex-1 pr-2 space-y-3">
                      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                      </h3>
                      {(article.description || article.content) && (
                        <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                          {article.description && <p>{article.description}</p>}
                          {article.content && article.content !== article.description && <p>{article.content}</p>}
                        </div>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-500 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                      <span>
                        {new Intl.DateTimeFormat('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        }).format(new Date(article.published_at))}
                      </span>
                      <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read more 
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
