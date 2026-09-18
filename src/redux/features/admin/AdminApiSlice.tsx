import { appApi } from "@/redux/services/appApi";

export interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  is_active: boolean;
  last_login_at?: string | null;
  roles?: string[];
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminListResponse {
  data: AdminUser[];
  links?: Record<string, unknown>;
  meta?: {
    current_page?: number;
    last_page?: number;
    per_page?: number;
    total?: number;
    [key: string]: unknown;
  };
}

export interface SingleAdminResponse {
  data: AdminUser;
}

export const adminsApiSlice = appApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<AdminListResponse, { page?: number; search?: string } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append("page", params.page.toString());
        if (params?.search) queryParams.append("search", params.search);
        const str = queryParams.toString();
        return `admins${str ? `?${str}` : ""}`;
      },
      providesTags: ["admins"],
    }),

    createAdmin: builder.mutation<SingleAdminResponse, { name: string; username: string; email: string; password?: string; roles: string[] }>({
      query: (payload) => ({
        url: "admins",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["admins"],
    }),

    toggleAdminStatus: builder.mutation<SingleAdminResponse, number | string>({
      query: (id) => ({
        url: `admins/${id}/toggle-status`,
        method: "POST",
      }),
      invalidatesTags: ["admins"],
    }),

    assignAdminRoles: builder.mutation<SingleAdminResponse, { id: number | string; roles: string[] }>({
      query: ({ id, roles }) => ({
        url: `admins/${id}/roles`,
        method: "POST",
        body: { roles },
      }),
      invalidatesTags: ["admins"],
    }),
  }),
});

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useToggleAdminStatusMutation,
  useAssignAdminRolesMutation,
} = adminsApiSlice;
