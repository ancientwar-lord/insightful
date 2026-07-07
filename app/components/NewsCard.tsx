"use client";

import { useState, useTransition } from "react";
import { createArticleAction, removeArticleAction, deleteArticle } from "../lib/actions";
import ActionDescriptionModal from "./ActionDescriptionModal";

interface ArticleAction {
  id: number;
  action_type: string;
  description?: string | null;
}

interface NewsCardProps {
  article: {
    id: number;
    title: string;
    description?: string | null;
    url: string;
    url_to_image?: string | null;
    published_at: string;
    content?: string | null;
    source_name: string;
    keyword?: string | null;
  };
  actions?: ArticleAction[];
  /** If set, show description text above the image (used in Collections page) */
  showDescription?: string | null;
}

export default function NewsCard({ article, actions = [], showDescription }: NewsCardProps) {
  const [isPending, startTransition] = useTransition();
  const [localActions, setLocalActions] = useState<ArticleAction[]>(actions);
  const [isDeleted, setIsDeleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<"spam" | "to_read" | "learnings">("spam");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isDeleted) return null;

  const hasAction = (type: string) => localActions.some((a) => a.action_type === type);

  // ─── Favourite toggle (instant) ─────────────────────────────────────
  const handleFavourite = () => {
    const isFav = hasAction("favourite");
    startTransition(async () => {
      if (isFav) {
        const result = await removeArticleAction(article.id, "favourite");
        if (result.success) {
          setLocalActions((prev) => prev.filter((a) => a.action_type !== "favourite"));
        }
      } else {
        const result = await createArticleAction(article.id, "favourite");
        if (result.success) {
          setLocalActions((prev) => [...prev, { id: Date.now(), action_type: "favourite" }]);
        }
      }
    });
  };

  // ─── Spam / To Read / Learnings (open modal) ───────────────────────
  const handleActionWithDescription = (type: "spam" | "to_read" | "learnings") => {
    if (hasAction(type)) {
      // Toggle off
      startTransition(async () => {
        const result = await removeArticleAction(article.id, type);
        if (result.success) {
          setLocalActions((prev) => prev.filter((a) => a.action_type !== type));
        }
      });
    } else {
      setModalActionType(type);
      setModalOpen(true);
    }
  };

  const handleModalSave = async (description: string) => {
    const result = await createArticleAction(article.id, modalActionType, description);
    if (result.success) {
      setLocalActions((prev) => [
        ...prev,
        { id: Date.now(), action_type: modalActionType, description },
      ]);
    }
    setModalOpen(false);
  };

  // ─── Delete (confirm dialog then permanent remove) ──────────────────
  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteArticle(article.id);
      if (result.success) {
        setIsDeleted(true);
      }
    });
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="group flex flex-col bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 relative">
        
        {/* ─── Action Buttons (sticky above scroll) ────────────────── */}
        <div className="flex items-center justify-between gap-1 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-1">
            {/* Favourite */}
            <button
              onClick={handleFavourite}
              disabled={isPending}
              title={hasAction("favourite") ? "Remove from Favourites" : "Add to Favourites"}
              className={`p-2 rounded-lg transition-all duration-200 ${
                hasAction("favourite")
                  ? "text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill={hasAction("favourite") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            {/* To Read */}
            <button
              onClick={() => handleActionWithDescription("to_read")}
              disabled={isPending}
              title={hasAction("to_read") ? "Remove from To Read" : "Mark as To Read"}
              className={`p-2 rounded-lg transition-all duration-200 ${
                hasAction("to_read")
                  ? "text-blue-500 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill={hasAction("to_read") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </button>

            {/* Learnings */}
            <button
              onClick={() => handleActionWithDescription("learnings")}
              disabled={isPending}
              title={hasAction("learnings") ? "Remove Learning" : "Add Learning"}
              className={`p-2 rounded-lg transition-all duration-200 ${
                hasAction("learnings")
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill={hasAction("learnings") ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>

            {/* Spam */}
            <button
              onClick={() => handleActionWithDescription("spam")}
              disabled={isPending}
              title={hasAction("spam") ? "Remove Spam Mark" : "Mark as Spam"}
              className={`p-2 rounded-lg transition-all duration-200 ${
                hasAction("spam")
                  ? "text-orange-500 bg-orange-50 dark:bg-orange-500/10 hover:bg-orange-100 dark:hover:bg-orange-500/20"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-500/10"
              }`}
            >
              <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </button>
          </div>

          {/* Delete */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isPending}
            title="Delete Article"
            className="p-2 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* ─── Description banner (Collections page only) ──────────── */}
        {showDescription && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-500/5 dark:to-violet-500/5 border-b border-blue-100 dark:border-blue-500/10">
            <p className="text-sm text-blue-700 dark:text-blue-300 italic leading-relaxed">
              &ldquo;{showDescription}&rdquo;
            </p>
          </div>
        )}

        {/* ─── Image ──────────────────────────────────────────────── */}
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

        {/* ─── Content ────────────────────────────────────────────── */}
        <div className="flex flex-col flex-1 p-6 sm:p-8">
          <div className="max-h-64 overflow-y-auto custom-scrollbar mb-6 flex-1 pr-2 space-y-3">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {article.title}
              </h3>
            </a>
            {(article.description || article.content) && (
              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                {article.description && <p>{article.description}</p>}
                {article.content && article.content !== article.description && (
                  <p>{article.content}</p>
                )}
              </div>
            )}
          </div>
          <div className="mt-auto flex items-center justify-between text-xs font-medium text-zinc-500 dark:text-zinc-500 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
            <span>
              {new Intl.DateTimeFormat("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(new Date(article.published_at))}
            </span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Read more
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* ─── Delete Confirmation Overlay ─────────────────────────── */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm rounded-3xl">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 mx-4 shadow-2xl border border-zinc-200 dark:border-zinc-700 max-w-sm w-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Delete Article?
                </h4>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2">
                &ldquo;{article.title}&rdquo; will be permanently removed.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  {isPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Action Description Modal ──────────────────────────────── */}
      <ActionDescriptionModal
        isOpen={modalOpen}
        actionType={modalActionType}
        articleTitle={article.title}
        onSave={handleModalSave}
        onCancel={() => setModalOpen(false)}
      />
    </>
  );
}
