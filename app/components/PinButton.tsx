"use client";

import { useTransition, useState } from "react";
import { toggleSourcePin, toggleKeywordPin } from "../lib/actions";

interface PinButtonProps {
  id: number;
  type: "source" | "keyword";
  initialIsPinned: boolean;
}

export default function PinButton({ id, type, initialIsPinned }: PinButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isPinned, setIsPinned] = useState(initialIsPinned);

  const handleToggle = () => {
    const newStatus = !isPinned;
    setIsPinned(newStatus); // Optimistic update

    startTransition(async () => {
      let res;
      if (type === "source") {
        res = await toggleSourcePin(id, newStatus);
      } else {
        res = await toggleKeywordPin(id, newStatus);
      }
      
      if (!res.success) {
        // Revert on failure
        setIsPinned(!newStatus);
        alert(res.message || "Failed to pin item");
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`relative z-20 p-2 rounded-full transition-all duration-300 ${
        isPinned
          ? "bg-amber-100 text-amber-500 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-900/60"
          : "text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
      }`}
      title={isPinned ? "Unpin" : "Pin to top"}
    >
      <svg 
        className={`w-5 h-5 ${isPinned ? "fill-current" : ""}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={isPinned ? 1.5 : 2} 
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
        />
      </svg>
    </button>
  );
}
