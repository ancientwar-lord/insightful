import Link from "next/link";
import EditSourceModal from "../../../components/EditSourceModal";
import RefreshSourceBanner from "../../../components/RefreshSourceBanner";
import DeleteSourceButton from "../../../components/DeleteSourceButton";
import { buildApiUrl } from "../../../lib/api";

export const dynamic = "force-dynamic";

async function getSourceData(id: string) {
  try {
    // Fetch source details
    const srcRes = await fetch(buildApiUrl(`/sources/${id}`), { cache: "no-store" });
    if (!srcRes.ok) throw new Error("Failed to fetch source");
    const source = await srcRes.json();
    
    // Fetch source history
    const histRes = await fetch(buildApiUrl(`/sources/${id}/history`), { cache: "no-store" });
    if (!histRes.ok) throw new Error("Failed to fetch history");
    const historyData = await histRes.json();
    
    return { source, historyData };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function SourceHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const data = await getSourceData(resolvedParams.id);
  
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-xl text-zinc-500">Source not found.</p>
      </div>
    );
  }

  const { source, historyData } = data;
  const histories = historyData.histories || [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-4xl mx-auto px-6 pt-16 pb-32 flex flex-col">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link href="/sources" className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 capitalize">
                {source.name}
              </h1>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400">
              Refresh history logs for this specific news source.
            </p>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <EditSourceModal source={source} />
            <DeleteSourceButton id={source.id} sourceName={source.name} redirectTo="/sources" />
            
            <Link 
              href={`/sources/${source.id}/articles`}
              className="inline-flex items-center justify-center gap-2 h-10 px-6 text-sm font-semibold rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 shrink-0"
            >
              View All Articles
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </div>

        <RefreshSourceBanner sourceSlug={source.source_slug} sourceName={source.name} />

        {/* History Table/List */}
        <div className="w-full">
          {histories.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 font-medium">No history found for this source.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl shadow-black/5">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 uppercase">
                    <th className="py-5 px-6">Fetch Date</th>
                    <th className="py-5 px-4 text-center">Total Fetched</th>
                    <th className="py-5 px-4 text-center">Duplicates</th>
                    <th className="py-5 px-6 text-right">Newly Saved</th>
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
                        <td className="py-5 px-4 text-center text-zinc-600 dark:text-zinc-400 font-medium">
                          {hist.total_fetched}
                        </td>
                        <td className="py-5 px-4 text-center text-zinc-600 dark:text-zinc-400 font-medium">
                          {hist.total_duplicates}
                        </td>
                        <td className="py-5 px-6 text-right">
                          <Link href={`/sources/${source.id}/history/${hist.id}/articles`}>
                            <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-semibold text-sm transition-colors cursor-pointer">
                              +{hist.total_saved}
                            </span>
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
