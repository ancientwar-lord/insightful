"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/app/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, Pin, Library, ArrowRight, Zap, Shield, Bookmark } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [isGuestLoading, setIsGuestLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsGuestLoading(true);
    try {
      await authClient.signIn.anonymous({
        fetchOptions: {
          onSuccess: () => {
            router.push("/");
            router.refresh();
          },
          onError: (ctx) => {
            console.error(ctx.error.message);
            alert(ctx.error.message || "Failed to login as guest.");
          },
        },
      });
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred.");
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-black overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Decorative Gradients */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-violet-500/10 dark:bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm text-xs font-bold text-zinc-800 dark:text-zinc-200 mb-8 animate-fade-in shadow-sm">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
          Introducing AI-Driven News Synthesis
        </div>

        {/* Title */}
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none mb-8 max-w-4xl">
          Understand the world with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400">
            AI-powered
          </span>{" "}
          news summaries.
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed mb-12">
          Insightful aggregates real-time articles, tracks your favorite sources & keywords, and lets our AI analyst extract key takeaways for you.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-xl shadow-blue-500/20 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            Create Your Dashboard
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button
            onClick={handleGuestLogin}
            disabled={isGuestLoading}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isGuestLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-indigo-500" />
            )}
            {isGuestLoading ? "Initializing Guest Access..." : "Continue as Guest"}
          </button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative max-w-6xl mx-auto px-6 py-20 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            A smarter way to consume information
          </h2>
          <p className="mt-4 text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto">
            Say goodbye to endless tab scrolling. Pin, refresh, summarize, and note down essential insights in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group bg-white dark:bg-zinc-900/60 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              AI Analyst Assistant
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Run natural language prompts over any gathered news list. Let the AI agent generate syntheses, search trends, and answer complex current event questions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white dark:bg-zinc-900/60 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 hover:border-violet-500/50 dark:hover:border-violet-500/50 hover:shadow-2xl hover:shadow-violet-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform mb-6">
              <Pin className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Keyword & Source Pinning
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Pin critical keywords or specific publishers to your home page. Instantly request a background news pull to get the absolute newest updates on those topics.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white dark:bg-zinc-900/60 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform mb-6">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">
              Collections & Smart Notes
            </h3>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              Create collections to group articles on specific investigations. Write annotations, take notes, and keep important analysis coupled with the source content.
            </p>
          </div>
        </div>
      </section>

      {/* Tech Specifications / Highlights */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-200/50 dark:border-zinc-800/50 bg-zinc-50/50 dark:bg-zinc-950/20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
              Designed for speed, built for builders.
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Insightful bridges the gap between raw web news feeds and intelligence. Get a clean dashboard that lets you focus on building and learning instead of scanning headlines.
            </p>
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Instant fetch & refresh triggers
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  Private workspace database with secure auth
                </span>
              </div>
            </div>
          </div>
          
          <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-xs text-zinc-400 font-semibold font-mono">dashboard_preview.tsx</span>
            </div>
            
            <div className="space-y-3">
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded-md w-3/4 animate-pulse" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-md w-full animate-pulse" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded-md w-5/6 animate-pulse" />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-bold">Pinned Keywords</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">8</span>
              </div>
              <div className="border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex flex-col gap-2">
                <span className="text-xs text-zinc-400 font-bold">Latest Articles</span>
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">124</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-violet-600/10 dark:from-blue-900/20 dark:via-indigo-900/10 dark:to-violet-900/20 border border-blue-500/20 dark:border-blue-500/20 rounded-3xl p-12 md:p-16 backdrop-blur-sm relative overflow-hidden">
          <h2 className="text-3xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight mb-6">
            Ready to experience better news flow?
          </h2>
          <p className="max-w-lg mx-auto text-zinc-600 dark:text-zinc-400 mb-10">
            Sign up now and build your personalized smart-news dashboard in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 transition cursor-pointer shadow-lg hover:shadow-blue-500/20 active:scale-[0.98]"
            >
              Sign Up Now
            </Link>
            <button
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl text-base font-extrabold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition cursor-pointer active:scale-[0.98]"
            >
              Try Instant Guest Mode
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/50 py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>&copy; {new Date().getFullYear()} Insightful. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:underline">Home</Link>
            <Link href="/about" className="hover:underline">About</Link>
            <Link href="/login" className="hover:underline">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
