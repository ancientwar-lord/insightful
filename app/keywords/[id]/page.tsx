import Link from "next/link";
import RefreshKeywordBanner from "../../components/RefreshKeywordBanner";
import DeleteKeywordButton from "../../components/DeleteKeywordButton";

import { buildApiUrl } from "../../lib/api";

export const dynamic = "force-dynamic";

async function getKeywordData(id: string) {
  try {
    // Fetch keyword details
    const kwRes = await fetch(buildApiUrl(`/keywords/${id}`), { cache: "no-store" });
    if (!kwRes.ok) throw new Error("Failed to fetch keyword");
    const keyword = await kwRes.json();
    
    // Fetch keyword history
    const histRes = await fetch(buildApiUrl(`/keywords/${id}/history`), { cache: "no-store" });
    if (!histRes.ok) throw new Error("Failed to fetch history");
    const historyData = await histRes.json();
    
    return { keyword, historyData };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function KeywordHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getKeywordData(resolvedParams.id);
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-xl text-zinc-500">Keyword not found.</p>
      </div>
    );
  }

  const { keyword, historyData } = data;
  const histories = historyData.histories || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-32 flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/keywords" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
                {keyword.keyword}
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Refresh history logs for this specific search query.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <Link 
              href={`/keywords/${keyword.id}/articles`}
              className="inline-flex items-center justify-center gap-2 h-12 px-8 font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 shrink-0"
            >
              View All Articles
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
            <DeleteKeywordButton id={keyword.id} keywordName={keyword.keyword} redirectTo="/keywords" />
          </div>
        </div>

        <RefreshKeywordBanner keyword={keyword.keyword} />

        {/* History Table/List */}
        <div className="w-full">
          {histories.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No history found for this keyword.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl shadow-black/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="py-5 px-6">Fetch Date</th>
                    <th className="py-5 px-6">Total Found</th>
                    <th className="py-5 px-6">Fetched</th>
                    <th className="py-5 px-6">Duplicates</th>
                    <th className="py-5 px-6">Newly Saved</th>
                    <th className="py-5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {histories.map((hist: any) => {
                    const dateObj = new Date(hist.fetched_at + "Z");
                    const formattedDate = new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Asia/Kolkata'
                    }).format(dateObj);
                    
                    return (
                      <tr key={hist.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors">
                        <td className="py-5 px-6 font-medium text-zinc-900 dark:text-zinc-100">
                          {formattedDate}
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                            {hist.total_found}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                            {hist.total_fetched}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-sm">
                            {hist.total_duplicates}
                          </span>
                        </td>
                        <td className="py-5 px-6">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold text-sm">
                            +{hist.total_saved}
                          </span>
                        </td>
                        <td className="py-5 px-6 text-right">
                          <Link 
                            href={`/keywords/${keyword.id}/history/${hist.id}`} 
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                          >
                            View Results
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
