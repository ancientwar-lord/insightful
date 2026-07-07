"use client";

import { useState } from "react";

interface ActionDescriptionModalProps {
  isOpen: boolean;
  actionType: "spam" | "to_read" | "learnings";
  articleTitle: string;
  onSave: (description: string) => void;
  onCancel: () => void;
}

const ACTION_LABELS: Record<string, { title: string; placeholder: string; emoji: string; color: string }> = {
  spam: {
    title: "Why marking as Spam?",
    placeholder: "e.g., Irrelevant content, clickbait, misleading headline...",
    emoji: "🚫",
    color: "from-red-500 to-orange-500",
  },
  to_read: {
    title: "Why do you want to read this?",
    placeholder: "e.g., Interesting topic, need for research, follow-up required...",
    emoji: "📖",
    color: "from-blue-500 to-cyan-500",
  },
  learnings: {
    title: "What learnings did you get?",
    placeholder: "e.g., Key takeaway, new insight, important data point...",
    emoji: "💡",
    color: "from-amber-500 to-yellow-500",
  },
};

export default function ActionDescriptionModal({
  isOpen,
  actionType,
  articleTitle,
  onSave,
  onCancel,
}: ActionDescriptionModalProps) {
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const config = ACTION_LABELS[actionType];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(description);
    setDescription("");
    setIsSaving(false);
  };

  const handleCancel = () => {
    setDescription("");
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient */}
        <div className={`h-1.5 bg-gradient-to-r ${config.color}`} />

        <div className="p-6 sm:p-8">
          {/* Title */}
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{config.emoji}</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {config.title}
            </h3>
          </div>

          {/* Article reference */}
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5 line-clamp-2 pl-10">
            &ldquo;{articleTitle}&rdquo;
          </p>

          {/* Textarea */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={config.placeholder}
            rows={4}
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm"
          />

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 mt-5">
            <button
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${config.color} hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
