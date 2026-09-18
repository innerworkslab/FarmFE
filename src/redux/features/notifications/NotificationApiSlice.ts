import { appApi } from "@/redux/services/appApi";

export type Notification = {
  id: number;
  title?: string;
  body?: string;
  data?: {
    title?: string;
    body?: string;
    payment_id?: string | number;
    [key: string]: unknown;
  };
  read_at: string | null;
  created_at: string;
};

export type NotificationsResponse = {
  data: Notification[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

export type GetNotificationsParams = {
  read?: number;
  per_page?: number;
  page?: number;
};

const notificationApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, GetNotificationsParams>({
      query: (params) => ({
        url: "/notifications",
        params,
      }),
      providesTags: ["notifications"],
    }),
    markNotificationRead: builder.mutation<{ message?: string }, number | string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: "POST",
      }),
      invalidatesTags: ["notifications"],
    }),
    markSelectedNotificationsRead: builder.mutation<
      { message?: string },
      { notification_ids?: number[]; ids?: number[] }
    >({
      query: (body) => ({
        url: "/notifications/mark-read",
        method: "POST",
        body,
      }),
      invalidatesTags: ["notifications"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkSelectedNotificationsReadMutation,
} = notificationApiSlice;
