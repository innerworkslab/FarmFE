// src/redux/features/setup/ActivityLogApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface ActivityLog {
  id: number;
  log_name: string;
  event: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  properties?: Record<string, unknown>;
  created_at: string;
}

export type ActivityLogItem = ActivityLog;

export interface ActivityLogListResponse {
  data: ActivityLog[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleActivityLogResponse {
  data: ActivityLog;
}

export const activityLogApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query<
      ActivityLogListResponse,
      { log_name?: string; page?: number; per_page?: number } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.log_name) queryParams.append("log_name", params.log_name);
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        const str = queryParams.toString();
        return `setup/activity-logs${str ? `?${str}` : ""}`;
      },
      providesTags: ["activityLogs"],
    }),

    getActivityLog: builder.query<SingleActivityLogResponse, number | string>({
      query: (id) => `setup/activity-logs/${id}`,
      providesTags: ["activityLogs"],
    }),
  }),
});

export const {
  useGetActivityLogsQuery,
  useGetActivityLogQuery,
} = activityLogApiSlice;
