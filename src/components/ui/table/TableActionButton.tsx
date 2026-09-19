import React from "react";

export type TableActionTone = "neutral" | "blue" | "green" | "amber" | "red";

const toneClass: Record<TableActionTone, string> = {
  neutral: "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.03]",
  blue: "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/50",
  green: "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/60 dark:bg-green-950/30 dark:text-green-300 dark:hover:bg-green-950/50",
  amber: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 dark:hover:bg-amber-950/50",
  red: "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50",
};

export default function TableActionButton({
  label,
  icon,
  tone = "neutral",
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  tone?: TableActionTone;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition ${toneClass[tone]}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
