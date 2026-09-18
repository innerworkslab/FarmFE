import React from "react";

export default function Loading({ className }: { className?: string }) {
  return (
    <div
      className={`h-16 w-16 animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent ${className}`}
    ></div>
  );
}
