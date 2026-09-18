"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { onMessageListener } from "@/lib/firebase";
import { useAppSelector } from "@/redux/hook";
import { useGetNotificationsQuery } from "@/redux/features/notifications/NotificationApiSlice";

export function NotificationListener() {
  const token = useAppSelector((state) => state.auth.token);
  const { refetch } = useGetNotificationsQuery(
    { read: 0, per_page: 10 },
    { skip: !token }
  );

  useEffect(() => {
    let isMounted = true;

    const listen = async () => {
      while (isMounted && !token) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      if (!isMounted) return;
      console.log("FCM: Foreground listener registered");

      while (isMounted) {
        const payload = (await onMessageListener()) as {
          from?: string;
          notification?: { title?: string; body?: string };
        } | null;

        if (!payload) continue;

        console.log("FCM foreground notification received:", payload);

        const title = payload.notification?.title || "New notification";
        const body = payload.notification?.body || "You have a new message";

        toast(title, { description: body });
        await refetch();
      }
    };

    void listen();

    return () => {
      isMounted = false;
    };
  }, [refetch, token]);

  return null;
}
