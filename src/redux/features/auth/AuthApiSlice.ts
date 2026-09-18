// src/redux/features/auth/AuthApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  username: string;
  account_status: "active" | "inactive" | "suspended" | string;
  last_login_at?: string | null;
  two_factor_enabled?: boolean;
  roles?: string[];
  permissions?: string[];
}

export interface LoginPayload {
  login: string; // email address or username
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  token_type: string;
  access_token: string;
  user: AuthUser;
}

export interface MeResponse {
  data: AuthUser;
}

export interface LogoutResponse {
  message: string;
}

export interface PermissionItem {
  name: string;
  guard_name: string;
}

export interface PermissionCatalogResponse {
  data: PermissionItem[];
}

export const authApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginPayload>({
      query: (body) => ({
        url: "auth/login",
        method: "POST",
        body,
      }),
      invalidatesTags: ["auth"],
    }),

    getMe: builder.query<MeResponse, void>({
      query: () => "auth/me",
      providesTags: ["auth"],
    }),

    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: "auth/logout",
        method: "POST",
      }),
      invalidatesTags: ["auth"],
    }),

    getPermissionCatalog: builder.query<PermissionCatalogResponse, void>({
      query: () => "authorization/permissions",
      providesTags: ["permissions"],
    }),
  }),
});

export const {
  useLoginMutation,
  useGetMeQuery,
  useLogoutMutation,
  useGetPermissionCatalogQuery,
} = authApiSlice;
