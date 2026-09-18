// src/redux/features/setup/RoleSetupApiSlice.ts

import { farmApi } from "@/redux/services/farmApi";

export interface SetupRole {
  id: number;
  name: string;
  branch_id?: number | null;
  status: "active" | "inactive" | string;
  permissions?: string[];
  version?: number;
  created_at: string;
  updated_at: string;
  branch?: {
    id: number;
    code: string;
    name: string;
  } | null;
}

export interface SetupRoleListResponse {
  data: SetupRole[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleSetupRoleResponse {
  data: SetupRole;
}

export interface SetupRolePayload {
  name: string;
  branch_id?: number | null;
  status?: string;
  permissions: string[];
}

export const roleSetupApiSlice = farmApi.injectEndpoints({
  endpoints: (builder) => ({
    getSetupRoles: builder.query<
      SetupRoleListResponse,
      { page?: number; search?: string } | void
    >({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `setup/roles${str ? `?${str}` : ""}`;
      },
      providesTags: ["setupRoles"],
    }),

    createSetupRole: builder.mutation<SingleSetupRoleResponse, SetupRolePayload>({
      query: (payload) => ({
        url: "setup/roles",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["setupRoles"],
    }),

    updateSetupRole: builder.mutation<
      SingleSetupRoleResponse,
      { id: number | string; body?: Partial<SetupRolePayload> } & Partial<SetupRolePayload>
    >({
      query: ({ id, body, ...rest }) => ({
        url: `setup/roles/${id}`,
        method: "POST",
        body: body || rest,
      }),
      invalidatesTags: ["setupRoles"],
    }),

    toggleSetupRoleStatus: builder.mutation<SingleSetupRoleResponse, number | string>({
      query: (id) => ({
        url: `setup/roles/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["setupRoles"],
    }),

    deleteSetupRole: builder.mutation<{ message: string }, number | string>({
      query: (id) => ({
        url: `setup/roles/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["setupRoles"],
    }),
  }),
});

export const {
  useGetSetupRolesQuery,
  useCreateSetupRoleMutation,
  useUpdateSetupRoleMutation,
  useToggleSetupRoleStatusMutation,
  useDeleteSetupRoleMutation,
} = roleSetupApiSlice;
