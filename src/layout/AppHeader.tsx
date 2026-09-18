"use client";

import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import NotificationDropdown from "@/components/header/NotificationDropdown";
import UserDropdown from "@/components/header/UserDropdown";
import { useSidebar } from "@/context/SidebarContext";
import React, { useRef } from "react";
import { Search, Globe } from "lucide-react";

const AppHeader: React.FC = () => {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 flex w-full max-w-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 z-40">
      <div className="flex items-center justify-between grow px-4 lg:px-6 py-3 min-w-0">
        {/* Left Search Area */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="flex items-center justify-center w-10 h-10 text-gray-500 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 shrink-0"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="relative hidden sm:block w-48 sm:w-60 md:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search..."
              className="w-full bg-gray-50 dark:bg-gray-800/60 text-sm text-gray-800 dark:text-gray-200 placeholder:text-gray-400 py-2 pl-9 pr-4 rounded-full border border-gray-200/80 dark:border-gray-700/60 focus:outline-none focus:ring-2 focus:ring-[#15803d]/30 focus:border-[#15803d] transition-all"
            />
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500 font-medium hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer px-2 py-1.5 rounded-lg">
            <Globe size={16} />
            <span>language</span>
          </div>

          <ThemeToggleButton />

          <NotificationDropdown title="Notifications" />

          <div className="pl-2 border-l border-gray-200 dark:border-gray-800">
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
