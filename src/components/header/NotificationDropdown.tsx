"use client";

import React, { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { Bell, Check, Loader2 } from "lucide-react";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkSelectedNotificationsReadMutation,
} from "@/redux/features/notifications/NotificationApiSlice";
import moment from "moment";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  title?: string;
};

export default function NotificationDropdown({ title = "Notifications" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const { data, isLoading } = useGetNotificationsQuery({ read: 0, per_page: 10 });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkSelectedNotificationsReadMutation();

  const notifications = data?.data || [];
  const unreadCount = data?.meta?.total as number || 0;
  const unreadIds = notifications.map((n) => n.id);

  function toggleDropdown() {
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (unreadIds.length > 0) {
      try {
        await markAllRead({ notification_ids: unreadIds }).unwrap();
        toast.success("All notifications marked as read.");
      } catch {
        toast.error("Failed to mark notifications as read.");
      }
    }
  };

  const handleMarkSingleRead = async (id: string | number) => {
    try {
      await markRead(id).unwrap();
      toast.success("Notification marked as read.");
    } catch {
      toast.error("Failed to mark notification as read.");
    }
  };

  const handleNotificationClick = async (id: string | number, paymentId?: unknown) => {
    try {
      await markRead(id).unwrap();
    } catch (err: unknown) {
      console.error("Failed to mark read:", err);
    }
    closeDropdown();
    if (paymentId) {
      router.push(`/payments/${paymentId}`);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="relative flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notification"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-gray-900 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 w-80 rounded-2xl p-4 shadow-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-50"
      >
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3 mb-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white">
            {title} {unreadCount > 0 ? `(${unreadCount})` : ""}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-[#15803d] dark:text-emerald-400 hover:underline font-semibold"
            >
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2 divide-y divide-gray-50 dark:divide-gray-800">
          {isLoading ? (
            <div className="flex items-center justify-center py-6 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">
              No new notifications
            </div>
          ) : (
            notifications.map((notification, index) => {
              const titleText = notification.data?.title || "Notification";
              const bodyText = notification.data?.body || "";
              const paymentId = notification.data?.payment_id;
              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, paymentId)}
                  className={`flex items-start justify-between gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/40 ${
                    index > 0 ? "pt-3 border-t border-gray-100 dark:border-gray-800" : ""
                  }`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-1">
                      {titleText}
                    </p>
                    <p className="text-[11px] text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                      {bodyText}
                    </p>
                    <p className="text-[9px] text-gray-400">
                      {moment(notification.created_at).fromNow()}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkSingleRead(notification.id);
                    }}
                    className="p-1 text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg shrink-0 transition-all"
                    title="Mark as read"
                  >
                    <Check size={14} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Dropdown>
    </div>
  );
}
