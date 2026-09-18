// src/redux/features/setup/AdminSetupApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface SetupAdmin {
  id: number;
  name: string;
  email: string;
  username: string;
  account_status: string;
  two_factor_enabled: boolean;
  last_login_at?: string | null;
  password_changed_at?: string | null;
  roles?: string[];
  branch_ids?: number[];
  branches?: Array<{ id: number; name?: string; code?: string }>;
  version?: number;
  created_at: string;
  updated_at: string;
}

export type SetupAdminUser = SetupAdmin;

export interface SetupAdminListResponse {
  data: SetupAdmin[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleSetupAdminResponse {
  data: SetupAdmin;
}

export interface CreateSetupAdminPayload {
  name: string;
  email: string;
  username: string;
  password?: string;
  account_status: string;
  two_factor_enabled: boolean;
  roles: string[];
  branch_ids?: number[];
}

export type SetupAdminPayload = CreateSetupAdminPayload;

export interface UpdateSetupAdminPayload {
  name: string;
  email: string;
  username: string;
  account_status: string;
  two_factor_enabled: boolean;
  roles: string[];
  branch_ids?: number[];
}

export const adminSetupApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getSetupAdmins: builder.query<
      SetupAdminListResponse,
      { page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/admins${str ? `?${str}` : ""}`;
      },
      providesTags: ["setupAdmins"],
    }),

    getSetupAdmin: builder.query<SingleSetupAdminResponse, number | string>({
      query: (id) => `setup/admins/${id}`,
      providesTags: ["setupAdmins"],
    }),

    createSetupAdmin: builder.mutation<SingleSetupAdminResponse, CreateSetupAdminPayload>({
      query: (payload) => ({
        url: "setup/admins",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["setupAdmins"],
    }),

    updateSetupAdmin: builder.mutation<
      SingleSetupAdminResponse,
      { id: number | string; body?: Partial<UpdateSetupAdminPayload> } & Partial<UpdateSetupAdminPayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/admins/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["setupAdmins"],
    }),

    deleteSetupAdmin: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/admins/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["setupAdmins"],
    }),
  }),
});

export const {
  useGetSetupAdminsQuery,
  useGetSetupAdminQuery,
  useCreateSetupAdminMutation,
  useUpdateSetupAdminMutation,
  useDeleteSetupAdminMutation,
} = adminSetupApiSlice;
