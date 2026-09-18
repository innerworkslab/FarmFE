// src/redux/services/appApi.ts

import {
  createApi,
  fetchBaseQuery,
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "@/redux/store";
import { clearToken } from "../features/AuthSlice";
import { removeCookie } from "@/utils/cookie";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const baseQuery = fetchBaseQuery({
  baseUrl: `${apiBaseUrl}/api/v1/management`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    headers.set("Accept", "application/json");
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  const result = await baseQuery(args, api, extraOptions);
  if (result.error && result.error.status === 401) {
    api.dispatch(clearToken());
    await removeCookie("userInfo");
  }

  if (result.data) {
    const data = result.data as { message?: string };
    if (data.message === "Unauthenticated.") {
      await removeCookie("userInfo");
      api.dispatch(clearToken());
    }
  }

  return result;
};

export const appApi = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "auth",
    "courses",
    "courseModules",
    "moduleLessons",
    "lessonResources",
    "videoProviders",
    "trainers",
    "roles",
    "permissions",
    "admins",
    "students",
    "studentNotes",
    "studentCourseAccesses",
    "paymentChannels",
    "payments",
    "enrollments",
    "activityLogs",
    "notifications",
    "fcmTokens",
    "certificates",
    "certificateTemplates",
    "libraryCategories",
    "libraryResources",
    "reports",
    "settings",
  ],
  endpoints: () => ({}),
});
