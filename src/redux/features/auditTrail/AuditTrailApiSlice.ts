import { appApi } from "@/redux/services/appApi";

export type ActivityLog = {
  id: number;
  description: string;
  subject_type?: string;
  causer_type?: string;
  causer?: { id?: number; name?: string };
  properties?: Record<string, unknown> & { username?: string };
  created_at: string;
};

export type ActivityLogsResponse = {
  data: ActivityLog[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
};

const auditTrailApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getActivityLogs: builder.query<ActivityLogsResponse, Record<string, unknown> | void>({
      query: (params) => ({ url: "/activity-logs", params: params || undefined }),
      providesTags: ["activityLogs"],
    }),
  }),
});

export const { useGetActivityLogsQuery } = auditTrailApiSlice;
