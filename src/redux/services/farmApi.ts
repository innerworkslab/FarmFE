// src/redux/services/farmApi.ts
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
  baseUrl: `${apiBaseUrl}/api/v1`,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("authorization", `Bearer ${token}`);
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
  return result;
};

export const farmApi = createApi({
  reducerPath: "farmApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    // Auth & Authorization
    "auth",
    "permissions",
    // Core Foundation
    "branches",
    "setupRoles",
    "setupAdmins",
    "activityLogs",
    // Business Masters
    "customers",
    "suppliers",
    "uoms",
    "foods",
    "medicines",
    "animals",
    "equipment",
    "farmInformation",
    "inventories",
    // Inventory Foundation
    "inventoryAdjustments",
    "inventoryBalances",
    "inventoryLedger",
    "inventoryConfirmations",
    // Purchasing Foundation
    "purchaseInvoices",
    "purchaseReceipts",
    // Farm Animal View
    "farmAnimalViews",
  ],
  endpoints: () => ({}),
});
