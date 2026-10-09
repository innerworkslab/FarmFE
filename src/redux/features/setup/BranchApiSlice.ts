// src/redux/features/setup/BranchApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface Branch {
  id: number;
  code: string;
  name: string;
  phone_number: string;
  address: string;
  status: "active" | "inactive" | string;
  version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface BranchListResponse {
  data: Branch[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleBranchResponse {
  data: Branch;
  message?: string;
}

export interface BranchPayload {
  code: string;
  name: string;
  phone_number: string;
  address: string;
  status: "active" | "inactive" | string;
}

export const branchApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getBranches: builder.query<
      BranchListResponse,
      { per_page?: number; page?: number; search?: string; status?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.per_page) queryParams.append("per_page", params.per_page.toString());
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        if (params?.status) queryParams.append("status", params.status);
        const str = queryParams.toString();
        return `setup/branches${str ? `?${str}` : ""}`;
      },
      providesTags: ["branches"],
    }),

    getBranch: builder.query<SingleBranchResponse, number | string>({
      query: (id) => `setup/branches/${id}`,
      providesTags: ["branches"],
    }),

    createBranch: builder.mutation<SingleBranchResponse, BranchPayload>({
      query: (payload) => ({
        url: "setup/branches",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["branches"],
    }),

    updateBranch: builder.mutation<
      SingleBranchResponse,
      { id: number | string } & BranchPayload
    >({
      query: ({ id, ...payload }) => ({
        url: `setup/branches/${id}`,
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["branches"],
    }),

    toggleBranchStatus: builder.mutation<SingleBranchResponse, number | string>({
      query: (id) => ({
        url: `setup/branches/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["branches"],
    }),

    deleteBranch: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/branches/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["branches"],
    }),
  }),
});

export const {
  useGetBranchesQuery,
  useGetBranchQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useToggleBranchStatusMutation,
  useDeleteBranchMutation,
} = branchApiSlice;
