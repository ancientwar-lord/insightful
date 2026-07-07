"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/app/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles, BookOpen, Compass, ShieldCheck, HelpCircle, ArrowRight } from "lucide-react";

export default function AboutPage() {
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

  const steps = [
    {
      num: "01",
      title: "Pin Keywords & Sources",
      desc: "Specify exact search keywords (e.g., 'Artificial Intelligence', 'Financial Markets') and select your trusted publications to establish your personal news feed.",
    },
    {
      num: "02",
      title: "Trigger Background Synced Feeds",
      desc: "Use manual or automatic refresh mechanisms to fetch real-time, clean article text into your local workspace database instantly.",
    },
    {
      num: "03",
      title: "Chat with the AI Analyst",
      desc: "Run semantic searches, request summaries, or compile reports across your customized corpus in plain English.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-zinc-50 dark:bg-black overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Background Gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 dark:bg-blue-600/10 blur-[130px] pointer-events-none" />

      {/* Header Info */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-6">
          About{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600 dark:from-blue-400 dark:to-violet-400">
            Insightful
          </span>
        </h1>
        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Insightful is a clean, developer-focused news intelligence platform designed to replace chaotic news feeds with controlled, searchable, and AI-summarized datasets.
        </p>
      </section>

      {/* Details Sections */}
      <section className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Mission Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none flex flex-col gap-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Our Mission</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Modern news consumption is broken. Algorithms push clickbait to maximize screen time, while useful information is spread across dozens of sources. Insightful puts you back in the driver's seat. 
              <br />
              <br />
              We believe in deliberate reading. By pulling articles only for topics and publishers you explicitly pin, and providing local AI analysis toolings, we help you master your domain without burnout.
            </p>
          </div>
        </div>

        {/* Why Us Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-none flex flex-col gap-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-3">Why Insightful?</h2>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              Unlike generic news readers, Insightful exposes raw intelligence controls. You don't just read articles; you can curate collections, make local notes, and stream conversations with an AI analyst that reads the articles for you.
              <br />
              <br />
              It runs fast, supports complete dark mode, offers temporary guest options to test features, and encrypts credentials for your personal database.
            </p>
          </div>
        </div>
      </section>

      {/* Steps Component */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-200/50 dark:border-zinc-800/50">
        <h2 className="text-3xl font-bold tracking-tight text-center text-zinc-900 dark:text-zinc-50 mb-16">
          How It Works
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.num} className="relative bg-zinc-50/50 dark:bg-zinc-900/20 p-8 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-4">
              <span className="text-5xl font-extrabold text-zinc-200 dark:text-zinc-800/80 select-none">
                {step.num}
              </span>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                {step.title}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mini CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 md:p-12 shadow-xl flex flex-col items-center">
          <h3 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-4">
            Curious to see it in action?
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mb-8">
            Experience our dashboard directly using instant guest access, or create an account to save your keywords permanently.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center">
            <button
              onClick={handleGuestLogin}
              disabled={isGuestLoading}
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 shadow-md hover:shadow-blue-500/20 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGuestLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-50" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isGuestLoading ? "Entering Guest Mode..." : "Launch Guest Access"}
            </button>
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Link>
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
