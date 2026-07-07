"use client";

import { useTransition } from "react";
import { deleteKeyword } from "../lib/actions";
import { useRouter } from "next/navigation";

interface DeleteKeywordButtonProps {
  id: number;
  keywordName: string;
  redirectTo?: string;
}

export default function DeleteKeywordButton({ id, keywordName, redirectTo }: DeleteKeywordButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (
      !confirm(
        `Are you sure you want to delete the keyword "${keywordName}"? This will permanently delete the keyword, its fetch history, and ALL articles associated with it.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteKeyword(id);
      if (res.success) {
        alert(res.message);
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.refresh();
        }
      } else {
        alert(res.message || "Failed to delete keyword");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-2 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all duration-300 relative z-20"
      title="Delete Keyword"
    >
      {isPending ? (
        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )}
    </button>
  );
}
