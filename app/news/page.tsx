import RefreshNews from "../components/RefreshNews";
import NewsCard from "../components/NewsCard";
import NewsFilters from "../components/NewsFilters";
import Link from "next/link";

import { buildApiUrl } from "../lib/api";

export const dynamic = "force-dynamic";

async function getNews(
  skip: number = 0,
  limit: number = 21,
  keywordIds?: string,
  sourceIds?: string,
  date?: string,
  search?: string
) {
  try {
    const params = new URLSearchParams();
    params.set("skip", String(skip));
    params.set("limit", String(limit));
    if (keywordIds) params.set("keyword_ids", keywordIds);
    if (sourceIds) params.set("source_ids", sourceIds);
    if (date) params.set("date", date);
    if (search) params.set("search", search);

    const endpointUrl = buildApiUrl(`/news/?${params.toString()}`);
    const res = await fetch(endpointUrl, { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch news data");
    return await res.json();
  } catch (error) {
    console.error(error);
    return { articles: [], total: 0 };
  }
}

async function getKeywords() {
  try {
    const endpointUrl = buildApiUrl("/keywords/");
    const res = await fetch(endpointUrl, { cache: "no-store" });
    if (!res.ok) return { keywords: [] };
    return await res.json();
  } catch {
    return { keywords: [] };
  }
}

async function getSources() {
  try {
    const endpointUrl = buildApiUrl("/sources/");
    const res = await fetch(endpointUrl, { cache: "no-store" });
    if (!res.ok) return { sources: [] };
    return await res.json();
  } catch {
    return { sources: [] };
  }
}

async function getArticleActions(articleIds: number[]) {
  // Fetch actions for all visible articles
  const results: Record<number, any[]> = {};
  await Promise.all(
    articleIds.map(async (id) => {
      try {
        const endpointUrl = buildApiUrl(`/actions/article/${id}`);
        const res = await fetch(endpointUrl, { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          results[id] = data.actions || [];
        }
      } catch {
        results[id] = [];
      }
    })
  );
  return results;
}

export default async function NewsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const pageStr = searchParams.page;
  const page = typeof pageStr === 'string' ? parseInt(pageStr, 10) || 1 : 1;
  const limit = 21;
  const skip = (page - 1) * limit;

  const keywordIds = typeof searchParams.keyword_ids === "string" ? searchParams.keyword_ids : undefined;
  const sourceIds = typeof searchParams.source_ids === "string" ? searchParams.source_ids : undefined;
  const date = typeof searchParams.date === "string" ? searchParams.date : undefined;
  const search = typeof searchParams.search === "string" ? searchParams.search : undefined;

  // Fetch all data in parallel
  const [data, keywordsData, sourcesData] = await Promise.all([
    getNews(skip, limit, keywordIds, sourceIds, date, search),
    getKeywords(),
    getSources(),
  ]);

  const articles = data.articles || [];

  // Fetch actions for visible articles
  const articleIds = articles.map((a: any) => a.id);
  const actionsMap = articleIds.length > 0 ? await getArticleActions(articleIds) : {};

  // Prepare filter options
  const filterKeywords = (keywordsData.keywords || []).map((kw: any) => ({
    id: kw.id,
    label: kw.keyword,
  }));
  const filterSources = (sourcesData.sources || []).map((src: any) => ({
    id: src.id,
    label: src.name,
  }));

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32 flex flex-col items-center">
        
        {/* Filters and Bulk Delete */}
        <div className="w-full">
          <NewsFilters keywords={filterKeywords} sources={filterSources} totalArticles={data.total} />
        </div>

        <div className="w-full mt-10">
          {articles.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No articles found.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Try refreshing the news or adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((article: any) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  actions={actionsMap[article.id] || []}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pagination controls */}
        {data.total > limit && (
          <div className="mt-16 flex items-center justify-center gap-4">
            {page > 1 ? (
              <Link
                href={`/news?page=${page - 1}${keywordIds ? `&keyword_ids=${keywordIds}` : ""}${sourceIds ? `&source_ids=${sourceIds}` : ""}${date ? `&date=${date}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                Previous
              </Link>
            ) : (
              <span className="px-6 py-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-400 dark:text-zinc-600 cursor-not-allowed">
                Previous
              </span>
            )}
            
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Page {page} of {Math.ceil(data.total / limit)}
            </span>
            
            {page * limit < data.total ? (
              <Link
                href={`/news?page=${page + 1}${keywordIds ? `&keyword_ids=${keywordIds}` : ""}${sourceIds ? `&source_ids=${sourceIds}` : ""}${date ? `&date=${date}` : ""}${search ? `&search=${search}` : ""}`}
                className="px-6 py-2.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 font-medium text-zinc-900 dark:text-zinc-100 hover:border-blue-500 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                Next
              </Link>
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
