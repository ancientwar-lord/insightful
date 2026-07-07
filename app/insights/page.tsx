"use client";

import React, { useState, useEffect, useRef } from "react";
import { buildApiUrl } from "../lib/api";

interface SupportingArticle {
  id: number;
  title: string;
  url: string;
  source_name: string;
}

interface Insight {
  id: number;
  trend: string;
  summary: string;
  supporting_ids: number[];
  relevance_score: number;
  grounding_score: number;
  actionability_score: number;
  eval_explanation: string;
  created_at: string;
  supporting_articles?: SupportingArticle[];
}

interface ConsoleLog {
  id: string;
  type: "info" | "tool" | "agent" | "error" | "success";
  message: string;
  timestamp: string;
}

export default function InsightsPage() {
  const [goal, setGoal] = useState<string>("job_seeker");
  const [topic, setTopic] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(true);
  
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [pendingInsight, setPendingInsight] = useState<any | null>(null);
  const [isWaitingForApproval, setIsWaitingForApproval] = useState<boolean>(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState<boolean>(false);
  
  const consoleEndRef = useRef<HTMLDivElement>(null);

  // Fetch saved insights history on load
  const fetchInsights = async () => {
    try {
      setIsLoadingHistory(true);
      const url = buildApiUrl("/agent/insights");
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      setInsights(data);
    } catch (error) {
      console.error("Error fetching insights:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  // Scroll console to bottom on new logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (type: ConsoleLog["type"], message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [
      ...prev,
      { id: Math.random().toString(), type, message, timestamp: time },
    ]);
  };

  const handleStartAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsAnalyzing(true);
    setPendingInsight(null);
    setIsWaitingForApproval(false);
    setLogs([]);
    addLog("info", `Starting analysis for topic: "${topic}" with goal: "${goal.replace("_", " ")}"...`);

    try {
      const url = buildApiUrl("/agent/stream-insights");
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: "user_default",
          goal_type: goal,
          topic: topic,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Unable to read stream body");
      }

      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const cleanLine = line.trim();
          if (!cleanLine) continue;

          if (cleanLine === "data: [DONE]") {
            addLog("success", "Analysis session finished streaming.");
            break;
          }

          if (cleanLine.startsWith("data: ")) {
            try {
              const eventData = JSON.parse(cleanLine.substring(6));
              
              if (eventData.type === "init") {
                setCurrentThreadId(eventData.thread_id);
                addLog("info", `Workflow session initialized (Thread ID: ${eventData.thread_id.substring(0, 8)}...)`);
              } else if (eventData.type === "pending_approval") {
                setPendingInsight({
                  trend: eventData.trend,
                  summary: eventData.summary,
                  supporting_ids: eventData.supporting_ids,
                  relevance_score: eventData.relevance_score,
                  grounding_score: eventData.grounding_score,
                  actionability_score: eventData.actionability_score,
                  eval_explanation: eventData.eval_explanation
                });
                setIsWaitingForApproval(true);
                addLog("info", "Agent workflow paused. Draft insight and Judge evaluation are pending your review.");
              } else if (eventData.type === "agent") {
                if (eventData.content) {
                  addLog("agent", eventData.content);
                }
              } else if (eventData.type === "tool") {
                addLog(
                  "tool",
                  `[Tool Output - ${eventData.name}]: ${eventData.content}`
                );
              } else if (eventData.type === "error") {
                addLog("error", `[Execution Error]: ${eventData.detail}`);
              }
            } catch (err) {
              console.error("Error parsing stream line:", err);
            }
          }
        }
      }

      // Re-fetch insights once agent finished running
      await fetchInsights();
    } catch (error: any) {
      console.error(error);
      addLog("error", `Fatal Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveReject = async (action: "approve" | "reject") => {
    if (!currentThreadId) return;
    setIsSubmittingApproval(true);
    addLog("info", `Submitting ${action} response to server...`);

    try {
      const url = buildApiUrl("/agent/approve");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          thread_id: currentThreadId,
          action: action,
        }),
      });

      if (!res.ok) throw new Error(`Approval submission failed: ${res.status}`);
      const data = await res.json();
      
      if (action === "approve") {
        addLog("success", `Insight successfully approved and saved! ID: ${data.message}`);
      } else {
        addLog("info", `Insight generation rejected. Workflow terminated.`);
      }

      setPendingInsight(null);
      setIsWaitingForApproval(false);
      await fetchInsights();
    } catch (error: any) {
      console.error(error);
      addLog("error", `Approval Error: ${error.message || "Something went wrong"}`);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleDeleteInsight = async (insightId: number) => {
    if (!confirm("Are you sure you want to delete this insight?")) return;

    try {
      const url = buildApiUrl(`/agent/insights/${insightId}`);
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete insight");
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
    } catch (error) {
      console.error("Error deleting insight:", error);
      alert("Failed to delete insight");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans selection:bg-blue-500/30">
      <main className="max-w-6xl mx-auto px-6 pt-16 pb-32">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50">
            AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Analyst</span>
          </h1>
          <p className="max-w-xl mx-auto text-lg text-zinc-600 dark:text-zinc-400">
            Run real-time multi-agent workflows to synthesize target news articles into high-value insights.
          </p>
        </div>

        {/* Input Panel */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl mb-10">
          <form onSubmit={handleStartAnalysis} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Target Audience / Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  disabled={isAnalyzing}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                >
                  <option value="job_seeker">Job Seeker (Finding hiring trends & companies)</option>
                  <option value="founder">Founder (Venture opportunities & competitor news)</option>
                  <option value="researcher">Researcher (Academic advancements & deep tech news)</option>
                  <option value="analyst">Market Analyst (Macro trends & industry declines)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Focus Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g., AI engineering layoffs, LLM agents, Next.js 16 release"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isAnalyzing}
                  required
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3.5 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition"
                />
              </div>

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isAnalyzing || !topic.trim()}
                className={`relative flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/20 active:scale-98 transition duration-200 cursor-pointer ${
                  isAnalyzing ? "opacity-75 cursor-not-allowed" : ""
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running Agent Flow...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Synthesize Insights
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Pending Approval Panel */}
        {pendingInsight && (
          <div className="bg-gradient-to-br from-violet-500/10 to-blue-500/10 border-2 border-violet-500/30 dark:border-violet-500/20 rounded-3xl p-8 shadow-2xl mb-10 backdrop-blur-md relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute top-0 right-0 p-4">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
              </span>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-3 py-1 bg-violet-200 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full animate-pulse">
                  Human-in-the-Loop Review Required
                </span>
              </div>

              <div>
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Drafted Trend</h2>
                <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                  {pendingInsight.trend}
                </h3>
              </div>

              <div>
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Drafted Summary</h2>
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap text-sm">
                  {pendingInsight.summary}
                </p>
              </div>

              {/* Evaluation Scores */}
              <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                <h2 className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
                  LLM-as-Judge Evaluation Scores (Draft Preview)
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { label: "Relevance", score: pendingInsight.relevance_score },
                    { label: "Grounding", score: pendingInsight.grounding_score },
                    { label: "Actionability", score: pendingInsight.actionability_score }
                  ].map((item) => {
                    const isLow = item.score < 7;
                    return (
                      <div key={item.label} className="bg-white/50 dark:bg-zinc-950/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.label}</span>
                        <div className="flex items-center gap-1.5">
                          {isLow && (
                            <span className="text-red-500 animate-bounce" title="Low Score Alert (< 7)">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </span>
                          )}
                          <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-emerald-500"}`}>
                            {item.score}/10
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pendingInsight.eval_explanation && (
                  <div className="mt-4">
                    <details className="group">
                      <summary className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer outline-none select-none flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 transform group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        View Judge Reasoning
                      </summary>
                      <p className="text-xs font-mono bg-white/40 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800/50 p-4 rounded-2xl text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed whitespace-pre-wrap">
                        {pendingInsight.eval_explanation}
                      </p>
                    </details>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={() => handleApproveReject("reject")}
                  className="px-6 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 font-bold rounded-2xl transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Reject & Discard
                </button>
                <button
                  type="button"
                  disabled={isSubmittingApproval}
                  onClick={() => handleApproveReject("approve")}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/10 active:scale-98 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {isSubmittingApproval ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Approve & Save
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Live Streaming Console */}
        {(logs.length > 0 || isAnalyzing) && (
          <div className="bg-zinc-950 rounded-3xl p-6 border border-zinc-800 shadow-2xl mb-12 overflow-hidden flex flex-col h-[400px]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-red-500" />
                <span className="w-3.5 h-3.5 rounded-full bg-yellow-500" />
                <span className="w-3.5 h-3.5 rounded-full bg-green-500" />
                <span className="ml-2 text-xs font-semibold text-zinc-400 font-mono">analyst_agent_session.log</span>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-2 text-xs text-blue-400 font-mono">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  Streaming Logs...
                </div>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 font-mono text-sm pr-2 scrollbar-thin scrollbar-thumb-zinc-800">
              {logs.map((log) => {
                let textClass = "text-zinc-300";
                let prefix = "[INFO]";

                if (log.type === "agent") {
                  textClass = "text-violet-300 font-medium pl-4 border-l-2 border-violet-500/50 my-1";
                  prefix = "[THOUGHT]";
                } else if (log.type === "tool") {
                  if (log.message.includes("[CRITICAL ALERT]")) {
                    textClass = "text-red-400 bg-red-950/20 px-2 py-1.5 rounded border border-red-500/25 font-bold my-1 block";
                    prefix = "[CRITICAL ALERT]";
                  } else {
                    textClass = "text-amber-300/90 bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10";
                    prefix = "[TOOL_CALL_RESULT]";
                  }
                } else if (log.type === "error") {
                  textClass = "text-red-400 bg-red-500/5 px-2 py-1 rounded border border-red-500/10";
                  prefix = "[ERROR]";
                } else if (log.type === "success") {
                  textClass = "text-emerald-400 font-bold bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10";
                  prefix = "[SUCCESS]";
                }

                return (
                  <div key={log.id} className="leading-relaxed whitespace-pre-wrap">
                    <span className="text-zinc-600 text-xs select-none mr-2">[{log.timestamp}]</span>
                    <span className={`text-xs font-bold mr-2 select-none ${
                      log.type === "agent" ? "text-violet-400" :
                      log.type === "tool" ? "text-amber-400" :
                      log.type === "error" ? "text-red-400" :
                      log.type === "success" ? "text-emerald-400" : "text-zinc-500"
                    }`}>{prefix}</span>
                    <span className={textClass}>{log.message}</span>
                  </div>
                );
              })}
              <div ref={consoleEndRef} />
            </div>
          </div>
        )}

        {/* Saved Insights Section */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <svg className="w-6 h-6 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Synthesized Trends ({insights.length})
          </h2>

          {isLoadingHistory ? (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-violet-500 border-t-transparent rounded-full mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">Loading insight history...</p>
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 border-dashed">
              <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium">No insights generated yet.</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Enter a topic above and let the AI analyst generate insights.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-violet-500/30 hover:shadow-2xl transition-all duration-300 relative group"
                >
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteInsight(insight.id)}
                    className="absolute top-6 right-6 p-2 rounded-xl text-zinc-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/20 transition cursor-pointer"
                    title="Delete insight"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-3 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-full">
                        Trend synthesis
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(insight.created_at).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-snug">
                      {insight.trend}
                    </h3>

                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                      {insight.summary}
                    </p>

                    {/* Judge Score Evaluation */}
                    {(insight.relevance_score > 0 || insight.grounding_score > 0 || insight.actionability_score > 0) && (
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50 space-y-3">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase block">
                          AI Evaluation Metrics (LLM-as-Judge)
                        </span>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {[
                            { label: "Relevance", score: insight.relevance_score },
                            { label: "Grounding", score: insight.grounding_score },
                            { label: "Actionability", score: insight.actionability_score }
                          ].map((item) => {
                            const isLow = item.score < 7;
                            return (
                              <div key={item.label} className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-255 dark:border-zinc-800/50 flex items-center justify-between">
                                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.label}</span>
                                <div className="flex items-center gap-1.5">
                                  {isLow && (
                                    <span className="text-red-500" title="Low Score Alert (< 7)">
                                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                    </span>
                                  )}
                                  <span className={`text-sm font-bold ${isLow ? "text-red-500" : "text-emerald-500"}`}>
                                    {item.score}/10
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {insight.eval_explanation && (
                          <details className="group mt-2">
                            <summary className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-semibold cursor-pointer outline-none select-none flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 transform group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                              </svg>
                              View Judge Reasoning
                            </summary>
                            <p className="text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800/50 p-3 rounded-2xl text-zinc-600 dark:text-zinc-450 mt-2 leading-relaxed whitespace-pre-wrap">
                              {insight.eval_explanation}
                            </p>
                          </details>
                        )}
                      </div>
                    )}

                    {/* Supporting Articles */}
                    {insight.supporting_articles && insight.supporting_articles.length > 0 && (
                      <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                        <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-3">
                          Supporting Evidence & Sources
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {insight.supporting_articles.map((article) => (
                            <a
                              key={article.id}
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition"
                            >
                              <span>{article.source_name}</span>
                              <span className="text-zinc-400 dark:text-zinc-600">|</span>
                              <span className="max-w-[200px] truncate">{article.title}</span>
                              <svg className="w-3 h-3 text-zinc-400 group-hover:text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
